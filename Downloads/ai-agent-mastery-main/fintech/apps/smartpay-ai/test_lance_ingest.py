#!/usr/bin/env python3
"""Test LanceDB ingestion to debug why only 10 rows persist."""

import asyncio
from smartpay_ai.db_utils import get_lancedb, generate_embeddings
import pandas as pd
import pyarrow as pa

async def test_ingestion():
    print("Creating test database...")
    db = get_lancedb()
    
    # Drop existing table
    try:
        db.drop_table("test_kb")
    except:
        pass
    
    # Create schema
    schema = pa.schema([
        pa.field("id", pa.string()),
        pa.field("title", pa.string()),
        pa.field("content", pa.string()),
        pa.field("embedding", pa.list_(pa.float32(), 1024)),
        pa.field("metadata", pa.string()),
        pa.field("user_id", pa.string()),
        pa.field("scope", pa.string()),
        pa.field("created_at", pa.timestamp('ms')),
    ])
    
    table = db.create_table("test_kb", schema=schema, mode="create")
    print("Created table")
    
    # Test 1: Add 15 documents in one batch
    print("\nTest 1: Adding 15 documents in one batch...")
    docs = []
    for i in range(15):
        embedding = await generate_embeddings([f"Test document {i}"])
        docs.append({
            "id": f"test_{i}",
            "title": f"Test {i}",
            "content": f"Content {i}",
            "embedding": embedding[0],
            "metadata": "{}",
            "user_id": "",
            "scope": "global",
            "created_at": pd.Timestamp.now(tz='UTC').floor('ms')
        })
    
    table.add(docs)
    print(f"Added {len(docs)} documents")
    
    # Check count
    table = db.open_table("test_kb")
    df = table.to_pandas()
    print(f"Count after add: {len(df)}")
    print(f"Document IDs: {list(df['id'])}")
    
    # Test 2: Add 10 more documents
    print("\nTest 2: Adding 10 more documents...")
    docs2 = []
    for i in range(15, 25):
        embedding = await generate_embeddings([f"Test document {i}"])
        docs2.append({
            "id": f"test_{i}",
            "title": f"Test {i}",
            "content": f"Content {i}",
            "embedding": embedding[0],
            "metadata": "{}",
            "user_id": "",
            "scope": "global",
            "created_at": pd.Timestamp.now(tz='UTC').floor('ms')
        })
    
    table.add(docs2)
    print(f"Added {len(docs2)} more documents")
    
    # Check final count
    table = db.open_table("test_kb")
    df = table.to_pandas()
    print(f"Final count: {len(df)}")
    print(f"Document IDs: {list(df['id'])}")

if __name__ == "__main__":
    asyncio.run(test_ingestion())
