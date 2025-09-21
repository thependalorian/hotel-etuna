'use client';

import PageLayout from '../components/PageLayout';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Award } from 'lucide-react';

/**
 * Certificates Page
 * 
 * Showcases professional certifications and educational achievements.
 * Features animated cards and interactive elements.
 * Located at: app/certificates/page.tsx
 */

interface Certificate {
  title: string;
  issuer: string;
  date: string;
  description: string;
  image: string;
  link?: string;
}

const certificates: Certificate[] = [
  {
    title: 'Agentic AI & Generative AI Bootcamp',
    issuer: 'Krish Naik Academy',
    date: '2025 (In Progress)',
    description: 'Advanced program focusing on building Agentic AI applications using Langflow, Agno, CrewAI, LangGraph, and AutoGen.',
    image: '/images/certificates/aibootcamp-cert.png',
    link: 'https://www.krishnaik.in/'
  },
  {
    title: 'Master of Business Administration (MBA)',
    issuer: 'Brandeis International Business School',
    date: '2024',
    description: 'STEM-designated MBA with concentrations in Data Analytics and Strategy & Innovation. GPA: 3.45/4.0',
    image: '/images/certificates/mba-certificate.JPG',
    link: 'https://www.brandeis.edu/global/academics/mba/index.html'
  },
  {
    title: 'Rearchitecting the Financial System',
    issuer: 'Centre for Finance, Technology and Entrepreneurship (CFTE)',
    date: '2024',
    description: 'Advanced study of emerging technologies and methodologies reshaping global financial infrastructure, including blockchain, DeFi, and embedded finance.',
    image: '/images/certificates/certificate5.png',
    link: 'https://courses.cfte.education/rearchitecting-the-financial-system-online-course/'
  },
  {
    title: 'Open Banking and Platforms Specialization',
    issuer: 'Centre for Finance, Technology and Entrepreneurship (CFTE)',
    date: '2023',
    description: 'Comprehensive understanding of open banking principles, regulatory frameworks, and platform business models in financial services.',
    image: '/images/certificates/openbanking-cert.png',
    link: 'https://courses.cfte.education/open-banking-and-platforms-in-finance-specialisation/'
  },
  {
    title: 'Fintech for Africa',
    issuer: 'Centre for Finance, Technology and Entrepreneurship (CFTE)',
    date: '2023',
    description: 'Specialized course focused on Open Banking, AI Applications in Finance, and Digital Transformation in the African context.',
    image: '/images/certificates/fintech-cert.png',
    link: 'https://courses.cfte.education/online-certificate-fintech-in-africa/'
  },
  {
    title: 'Operations Management',
    issuer: 'University of Cape Town',
    date: '2021',
    description: 'Comprehensive study of operational efficiency, process optimization, and management techniques for complex organizational systems.',
    image: '/images/certificates/operations-cert.JPG',
    link: 'https://www.getsmarter.com/products/uct-operations-management-online-short-course'
  },
  {
    title: 'Bachelor of Engineering in Civil & Environmental Engineering',
    issuer: 'Namibia University of Science & Technology',
    date: '2017',
    description: 'Comprehensive engineering education with focus on sustainable infrastructure, environmental protection, and water resource management.',
    image: '/images/certificates/engineering-degree.JPG',
    link: 'https://febe.nust.na/bachelor-engineering-civil-engineering'
  }
];

export default function Certificates() {
  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Professional Certifications</h1>
          <p className="text-xl text-base-content/70">
            A collection of academic achievements and professional development certifications
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {certificates.map((cert, index) => (
            <motion.div
              key={cert.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="card glass-card h-full">
                <figure className="px-4 pt-4">
                  <div className="relative w-full h-[200px] rounded-xl overflow-hidden">
                    <Image
                      src={cert.image}
                      alt={cert.title}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                </figure>
                <div className="card-body">
                  <h2 className="card-title flex items-center gap-2">
                    <Award className="w-5 h-5 text-accent" />
                    {cert.title}
                  </h2>
                  <div className="flex items-center gap-2 text-base-content/70">
                    <span>{cert.issuer}</span>
                    <span>•</span>
                    <span>{cert.date}</span>
                  </div>
                  <p className="text-base-content/80">{cert.description}</p>
                  {cert.link && (
                    <div className="card-actions justify-end mt-4">
                      <a
                        href={cert.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-accent btn-sm"
                      >
                        Learn More
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
} 