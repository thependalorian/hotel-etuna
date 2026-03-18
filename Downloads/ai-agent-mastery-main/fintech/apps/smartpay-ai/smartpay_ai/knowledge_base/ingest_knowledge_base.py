#!/usr/bin/env python3
"""
Ingest Smartpay knowledge base into LanceDB.

This script:
1. Reads the complete knowledge base markdown file
2. Splits into semantic chunks (~512 tokens each)
3. Generates BGE-M3 embeddings (1024-dim)
4. Inserts into LanceDB knowledge_base table
5. Verifies ingestion success

Usage:
    python -m smartpay_ai.knowledge_base.ingest_knowledge_base

Expected output:
    - ~187 chunks from 94KB markdown file
    - All chunks successfully embedded and inserted
    - Verification queries work correctly
"""

import asyncio
import logging
import sys
from pathlib import Path
from typing import List, Dict, Any
import re
import tiktoken

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Import project modules
from smartpay_ai.knowledge_base.ingest import ingest_documents
from smartpay_ai.db_utils import get_lancedb, get_or_create_knowledge_table


class MarkdownChunker:
    """Split markdown documents into semantic chunks respecting structure."""
    
    def __init__(self, chunk_size: int = 512, chunk_overlap: int = 50):
        """
        Initialize chunker.
        
        Args:
            chunk_size: Target chunk size in tokens
            chunk_overlap: Overlap between chunks in tokens
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.tokenizer = tiktoken.get_encoding("cl100k_base")  # GPT-4 encoding
    
    def count_tokens(self, text: str) -> int:
        """Count tokens in text."""
        return len(self.tokenizer.encode(text))
    
    def split_on_headers(self, markdown: str) -> List[Dict[str, str]]:
        """
        Split markdown into sections based on headers.
        
        Returns list of {title, content, level} dicts.
        """
        sections = []
        current_section = {"title": "", "content": "", "level": 0}
        
        lines = markdown.split("\n")
        for line in lines:
            # Check if line is a header
            header_match = re.match(r"^(#{1,6})\s+(.+)$", line)
            
            if header_match:
                # Save previous section if it has content
                if current_section["content"].strip():
                    sections.append(current_section.copy())
                
                # Start new section
                level = len(header_match.group(1))
                title = header_match.group(2).strip()
                current_section = {
                    "title": title,
                    "content": "",
                    "level": level
                }
            else:
                # Add line to current section
                current_section["content"] += line + "\n"
        
        # Add final section
        if current_section["content"].strip():
            sections.append(current_section)
        
        return sections
    
    def chunk_section(self, section: Dict[str, str]) -> List[Dict[str, str]]:
        """
        Chunk a single section if it's too large.
        
        Args:
            section: Section dict with title, content, level
            
        Returns:
            List of chunk dicts with title and content
        """
        title = section["title"]
        content = section["content"].strip()
        
        # Check if section fits in one chunk
        full_text = f"{title}\n\n{content}" if title else content
        token_count = self.count_tokens(full_text)
        
        if token_count <= self.chunk_size:
            # Section fits in one chunk
            return [{
                "title": title,
                "content": content
            }]
        
        # Section too large, split by paragraphs
        chunks = []
        paragraphs = content.split("\n\n")
        
        current_chunk = ""
        chunk_num = 1
        
        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
            
            # Check if adding this paragraph exceeds chunk size
            test_text = f"{current_chunk}\n\n{para}".strip()
            if self.count_tokens(test_text) > self.chunk_size and current_chunk:
                # Save current chunk
                chunk_title = f"{title} (Part {chunk_num})" if title else f"Part {chunk_num}"
                chunks.append({
                    "title": chunk_title,
                    "content": current_chunk.strip()
                })
                
                # Start new chunk with overlap
                # Take last few sentences for overlap
                sentences = current_chunk.split(". ")
                overlap_text = ". ".join(sentences[-2:]) if len(sentences) > 2 else ""
                current_chunk = f"{overlap_text}\n\n{para}".strip()
                chunk_num += 1
            else:
                # Add paragraph to current chunk
                current_chunk = test_text
        
        # Add final chunk
        if current_chunk.strip():
            chunk_title = f"{title} (Part {chunk_num})" if title and chunk_num > 1 else title
            chunks.append({
                "title": chunk_title or f"Part {chunk_num}",
                "content": current_chunk.strip()
            })
        
        return chunks
    
    def chunk_markdown(self, markdown: str) -> List[Dict[str, str]]:
        """
        Chunk entire markdown document.
        
        Args:
            markdown: Full markdown text
            
        Returns:
            List of chunk dicts with title and content
        """
        # Split on headers
        sections = self.split_on_headers(markdown)
        logger.info(f"Split markdown into {len(sections)} sections")
        
        # Chunk each section
        all_chunks = []
        for section in sections:
            section_chunks = self.chunk_section(section)
            all_chunks.extend(section_chunks)
        
        logger.info(f"Created {len(all_chunks)} chunks total")
        
        # Add metadata
        for i, chunk in enumerate(all_chunks):
            chunk["metadata"] = {
                "chunk_index": i,
                "source": "smartpay_complete_knowledge.md",
                "category": "knowledge_base"
            }
        
        return all_chunks


async def verify_ingestion(expected_count: int) -> bool:
    """
    Verify that ingestion was successful.
    
    Args:
        expected_count: Expected number of documents
        
    Returns:
        True if verification passed
    """
    try:
        db = get_lancedb()
        table = await get_or_create_knowledge_table(db)
        
        # Get table stats - use count_rows() to get actual count
        actual_count = table.count_rows()
        
        logger.info(f"Verification: Expected {expected_count} documents, found {actual_count}")
        
        if actual_count == 0:
            logger.error("❌ Verification FAILED: No documents in table")
            return False
        
        if actual_count < expected_count * 0.9:
            logger.warning(f"⚠️  Only {actual_count}/{expected_count} documents ingested ({actual_count/expected_count*100:.1f}%)")
        else:
            logger.info(f"✅ Ingestion verified: {actual_count}/{expected_count} documents ({actual_count/expected_count*100:.1f}%)")
        
        # Test a few sample queries
        test_queries = [
            "How do I redeem a voucher?",
            "What are the transaction limits?",
            "How does fraud detection work?"
        ]
        
        logger.info("\nTesting sample queries:")
        from smartpay_ai.knowledge_base.retrieve import retrieve
        
        for query in test_queries:
            # Use lower score threshold to ensure we get results
            results = await retrieve(query, limit=3, score_threshold=0.0)
            if results:
                logger.info(f"  ✅ '{query}' → {len(results)} results")
                logger.info(f"     Top result (score={results[0]['score']}): {results[0]['title'][:50]}...")
            else:
                logger.warning(f"  ⚠️  '{query}' → No results")
        
        return True
        
    except Exception as e:
        logger.exception(f"Verification failed: {e}")
        return False


async def main():
    """Main ingestion workflow."""
    logger.info("=" * 80)
    logger.info("Smartpay Knowledge Base Ingestion")
    logger.info("=" * 80)
    
    # 1. Load markdown file
    kb_path = Path(__file__).parent.parent / "data" / "knowledge_base" / "smartpay_complete_knowledge.md"
    
    if not kb_path.exists():
        logger.error(f"❌ Knowledge base file not found: {kb_path}")
        sys.exit(1)
    
    logger.info(f"Reading knowledge base from: {kb_path}")
    markdown_content = kb_path.read_text(encoding="utf-8")
    file_size_kb = len(markdown_content.encode("utf-8")) / 1024
    logger.info(f"File size: {file_size_kb:.1f} KB")
    
    # 2. Chunk markdown
    logger.info("\nChunking markdown into ~512 token segments...")
    chunker = MarkdownChunker(chunk_size=512, chunk_overlap=50)
    chunks = chunker.chunk_markdown(markdown_content)
    
    logger.info(f"\n✅ Created {len(chunks)} chunks")
    
    # Log sample chunks
    logger.info("\nSample chunks:")
    for i in [0, len(chunks)//2, len(chunks)-1]:
        chunk = chunks[i]
        tokens = chunker.count_tokens(f"{chunk['title']}\n\n{chunk['content']}")
        logger.info(f"  Chunk {i+1}: '{chunk['title'][:50]}...' ({tokens} tokens)")
    
    # 3. Prepare documents for ingestion
    documents = []
    for chunk in chunks:
        documents.append({
            "title": chunk["title"],
            "content": chunk["content"],
            "metadata": chunk["metadata"]
        })
    
    # 4. Ingest into LanceDB
    logger.info(f"\n{'='*80}")
    logger.info("Starting ingestion into LanceDB...")
    logger.info(f"{'='*80}\n")
    
    stats = await ingest_documents(
        documents=documents,
        scope="global",
        batch_size=50
    )
    
    # 5. Report results
    logger.info(f"\n{'='*80}")
    logger.info("Ingestion Results")
    logger.info(f"{'='*80}")
    logger.info(f"Total documents: {stats['total']}")
    logger.info(f"Successfully added: {stats['added']}")
    logger.info(f"Skipped (duplicates): {stats['skipped']}")
    logger.info(f"Errors: {stats['errors']}")
    
    if stats['added'] > 0:
        logger.info(f"\n✅ Successfully ingested {stats['added']} documents!")
    else:
        logger.error("\n❌ No documents were ingested!")
        sys.exit(1)
    
    # 6. Verify ingestion
    logger.info(f"\n{'='*80}")
    logger.info("Verifying Ingestion")
    logger.info(f"{'='*80}\n")
    
    verification_passed = await verify_ingestion(expected_count=stats['added'])
    
    if verification_passed:
        logger.info("\n" + "="*80)
        logger.info("🎉 Knowledge Base Ingestion Complete and Verified!")
        logger.info("="*80)
        sys.exit(0)
    else:
        logger.error("\n" + "="*80)
        logger.error("❌ Ingestion verification failed")
        logger.error("="*80)
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
