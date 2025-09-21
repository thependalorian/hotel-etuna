'use client';

import PageLayout from '../components/PageLayout';
import { motion } from 'framer-motion';
import { Award, Users, Target, Lightbulb, Mail, ArrowRight } from 'lucide-react';
import Image from 'next/image';

const challenges = [
  'In Namibia, approximately 42% of the adult population remains unbanked',
  '25% face barriers due to lack of access to affordable financial services',
  'Traditional banking systems often fail to meet the needs of younger generations',
  'Financial exclusion perpetuates inequality and limits economic participation'
];

export default function Buffr() {
  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="relative min-h-[600px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-base-100">
          <div className="absolute inset-0 backdrop-blur-sm"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Buffr - Your Next Payment Companion
              </h1>
              <p className="text-xl mb-6">
                Empowering Millennials and Gen Z in Namibia and Southern Africa with AI-powered financial solutions that make financial services accessible, affordable, and enjoyable.
              </p>
              <p className="text-lg mb-8">
                Winner of the 2023 Asper Student Startup Prize in Apps, Software and Computer Science category. 
                Founded by George Nekwaya, MBA'24, revolutionizing financial inclusion across Southern Africa.
              </p>
              <a 
                href="https://www.brandeis.edu/global/news/2023/asper-student-startup-prizes.html" 
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-accent gap-2"
              >
                Read Award Article
                <ArrowRight className="w-4 h-4" />
              </a>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative h-[400px] w-full rounded-xl overflow-hidden"
            >
              <Image
                src="/images/buffr/asper_win.jpeg"
                alt="Buffr Team at Asper Student Startup Prizes"
                fill
                className="object-cover"
                priority
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Recognition Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative h-[500px] w-full rounded-xl overflow-hidden"
            >
              <Image
                src="/images/buffr/buffr_app_mock.jpeg"
                alt="Buffr App Interface"
                fill
                className="object-contain"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl font-bold mb-6">Award-Winning Innovation</h2>
              <p className="text-lg mb-6">
                Buffr took home first place in the Apps, Software and Computer Science category at the first-ever 
                Asper Student Startup Prizes competition at Brandeis International Business School.
              </p>
              <p className="text-lg mb-6">
                Founded by George Nekwaya, MBA'24 and Evan Goddard, MSF'24, Buffr aims to transform 
                the financial landscape in Southern Africa, beginning with Namibia.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Challenges Section */}
      <section className="py-20 bg-base-200/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold mb-4">About Buffr</h2>
            <p className="text-xl text-base-content/70">
              Addressing Critical Financial Inclusion Challenges
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="card glass-card"
            >
              <div className="card-body">
                <h3 className="card-title text-2xl mb-4">Our Mission</h3>
                <p className="mb-6">
                  Buffr is an innovative fintech startup addressing the critical challenge of financial exclusion 
                  across Namibia and Southern Africa. Our mission is to empower Millennials and Gen Z by making 
                  financial services accessible, affordable, and enjoyable through an AI-powered platform.
                  We will begin with the launch of Buffr Lend, providing payday loans through employer-based salary 
                  deduction agreements, and will integrate additional features to enhance our offerings.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="card glass-card"
            >
              <div className="card-body">
                <h3 className="card-title text-2xl mb-4">The Challenge We're Solving</h3>
                <ul className="space-y-4">
                  {challenges.map((challenge, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary"></span>
                      <span>{challenge}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Buffr Products Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold mb-4">Buffr Product Ecosystem</h2>
            <p className="text-xl text-base-content/70">
              Comprehensive AI-powered financial solutions for individuals and businesses
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* BuffrLend */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="card glass-card h-full"
            >
              <div className="card-body flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-success/20 rounded-lg flex items-center justify-center">
                    <span className="text-lg font-bold text-success">L</span>
                  </div>
                  <div>
                    <h3 className="card-title text-xl">BuffrLend</h3>
                    <p className="text-sm text-base-content/60">B2B2C Lending Platform</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-white mb-2">"Smart Loans, Simple Process"</p>
                <p className="text-sm mb-4 flex-1">
                  Complete B2B2C lending platform with AI-powered KYC verification, 
                  WhatsApp AI agents, and enterprise CRM system for partner employers.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="badge badge-success badge-sm">AI KYC</span>
                  <span className="badge badge-accent badge-sm">WhatsApp AI</span>
                  <span className="badge badge-secondary badge-sm">Enterprise CRM</span>
                </div>
                <div className="card-actions justify-end">
                  <a
                    href="https://lend.buffr.ai"
                    className="btn btn-accent btn-sm"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Visit Platform
                  </a>
                </div>
              </div>
            </motion.div>

            {/* BuffrSign */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="card glass-card h-full"
            >
              <div className="card-body flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-warning/20 rounded-lg flex items-center justify-center">
                    <span className="text-lg font-bold text-warning">S</span>
                  </div>
                  <div>
                    <h3 className="card-title text-xl">BuffrSign</h3>
                    <p className="text-sm text-base-content/60">Digital Signature Platform</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-white mb-2">"Get Documents Signed in Minutes, Not Days"</p>
                <p className="text-sm mb-4 flex-1">
                  Advanced AI-powered digital signature platform with intelligent document processing, 
                  compliance validation, and secure signature workflows.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="badge badge-warning badge-sm">AI-Powered</span>
                  <span className="badge badge-accent badge-sm">Document Intelligence</span>
                  <span className="badge badge-secondary badge-sm">Workflow Automation</span>
                </div>
                <div className="card-actions justify-end">
                  <a
                    href="https://sign.buffr.ai"
                    className="btn btn-accent btn-sm"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Visit Platform
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Buffr Host */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="card glass-card h-full"
            >
              <div className="card-body flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center">
                    <span className="text-lg font-bold text-accent">H</span>
                  </div>
                  <div>
                    <h3 className="card-title text-xl">Buffr Host</h3>
                    <p className="text-sm text-base-content/60">Hospitality Management</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-white mb-2">"The Future of Hospitality, Today"</p>
                <p className="text-sm mb-4 flex-1">
                  Comprehensive cloud-based hospitality ecosystem management platform combining 
                  CRM-driven customer engagement and AI-powered business intelligence.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="badge badge-accent badge-sm">AI Receptionist</span>
                  <span className="badge badge-primary badge-sm">Multi-Service</span>
                  <span className="badge badge-secondary badge-sm">Business Intelligence</span>
                </div>
                <div className="card-actions justify-end">
                  <a
                    href="https://host.buffr.ai"
                    className="btn btn-accent btn-sm"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Visit Platform
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>


      {/* Strategic Alignment Section */}
      <section className="py-20 bg-base-200/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="card glass-card"
            >
              <div className="card-body">
                <h3 className="card-title text-2xl mb-4">Strategic Alignment with National Initiatives</h3>
                <p className="mb-6">
                  Buffr is strategically positioned to complement the Bank of Namibia's Instant Payment Project, 
                  which aims to modernize the country's payment infrastructure. As the central bank works to implement 
                  real-time payment capabilities and interoperability standards, Buffr serves as a consumer-facing 
                  interface that leverages this evolving infrastructure.
                </p>
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Market Opportunity:</h4>
                  <ul className="text-sm space-y-1">
                    <li>• TAM of $756 Million projected to grow to $1.47 Billion by 2030</li>
                    <li>• Target: 75% market capture by 2030</li>
                    <li>• Focus on 42% unbanked population in Namibia</li>
                    <li>• Strategic partnerships with Adumo for card payment processing</li>
                  </ul>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative h-[600px] w-full rounded-xl overflow-hidden"
            >
              <Image
                src="/images/buffr/buffr_app_mock4.png"
                alt="Buffr App Interface Showcase"
                fill
                className="object-contain"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Experiences Section */}
      <section className="py-20 bg-base-200/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold mb-4">Professional Experiences</h2>
            <p className="text-xl text-base-content/70">
              Highlighting key events that shape my fintech journey.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="card glass-card"
            >
              <div className="card-body">
                <h3 className="card-title text-2xl mb-4">FinTech Junction 2023</h3>
                <p>
                  Attended Israel's premier fintech conference, FinTech Junction 2023, held at the Hilton Tel Aviv. 
                  This event brought together over 1,000 attendees from 25 countries, including leaders from banks, 
                  fintech startups, and venture capital firms. I gained insights into global fintech trends, particularly 
                  in AI-driven innovation and digital payments, and had the opportunity to network with industry leaders, 
                  enhancing my understanding of the challenges and opportunities in the fintech landscape.
                </p>
                <div className="card-actions justify-center mt-4">
                  <a
                    href="https://www.fintechjunction.com"
                    className="btn btn-accent btn-outline btn-sm"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Visit Conference Page
                  </a>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="card glass-card"
            >
              <div className="card-body">
                <h3 className="card-title text-2xl mb-4">Black in eCom 2023</h3>
                <p>
                  Attended the Black in eCom Conference 2023, a pivotal event focused on empowering Black entrepreneurs and professionals in e-commerce and technology. 
                  The conference aimed to amplify Black voices in e-commerce, celebrate their contributions, and address industry challenges through networking, education, and empowerment initiatives.
                </p>
                <div className="card-actions justify-center mt-4">
                  <a
                    href="https://www.linkedin.com/posts/blackinecom_welcome-to-the-black-in-ecom-conference-activity-7092732100386181120-4053?utm_source=share&utm_medium=member_desktop&rcm=ACoAACHmrKMBJsEPzLjCIhVlKPGEli2lZbQy5EQ"
                    className="btn btn-accent btn-outline btn-sm"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Visit Conference Page
                  </a>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="card glass-card"
            >
              <div className="card-body">
                <h3 className="card-title text-2xl mb-4">MIT FinTech Conference 2024</h3>
                <p>
                  Engaged with innovators and professionals at the MIT FinTech Conference 2024. 
                  The conference addressed pressing issues in fintech, including real-time payments and AI applications 
                  in finance. I participated in discussions led by industry leaders from Visa and PayPal, gaining valuable 
                  insights into the future of financial services and the role of technology in enhancing customer experiences.
                </p>
                <div className="card-actions justify-center mt-4">
                  <a
                    href="https://www.mitfintech.com/"
                    className="btn btn-accent btn-outline btn-sm"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Visit Conference Page
                  </a>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="card glass-card"
            >
              <div className="card-body">
                <h3 className="card-title text-2xl mb-4">MIT FinTech Conference 2025</h3>
                <p>
                  Continued my engagement with cutting-edge fintech discussions at the MIT FinTech Conference 2025. 
                  This conference focused on the impact of open banking, AI, and digital currencies on financial services. 
                  I participated in networking opportunities, discussing strategies for navigating the evolving 
                  financial ecosystem and the importance of customer trust in adopting new technologies.
                </p>
                <div className="card-actions justify-center mt-4">
                  <a
                    href="https://www.mitfintech.com/"
                    className="btn btn-accent btn-outline btn-sm"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Visit Conference Page
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-base-200/50 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl font-bold mb-6">Connect With George Nekwaya</h2>
            <p className="text-xl text-base-content/70 mb-8">
              Founder & CEO of Buffr Inc. | Fintech Innovation Leader | AI/ML Specialist
            </p>
            <div className="card glass-card">
              <div className="card-body items-center">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                  <div className="text-center">
                    <p className="text-sm text-base-content/70 mb-2">Email</p>
                    <a
                      href="mailto:george@buffr.ai"
                      className="btn btn-accent btn-sm gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      george@buffr.ai
                    </a>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-base-content/70 mb-2">Location</p>
                    <p className="text-sm">Windhoek, Namibia</p>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm text-base-content/70 mb-2">Professional Links</p>
                  <div className="flex gap-2 justify-center">
                    <a
                      href="https://www.linkedin.com/in/george-nekwaya"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm"
                    >
                      LinkedIn
                    </a>
                    <a
                      href="https://www.georgenekwaya.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm"
                    >
                      Portfolio
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </PageLayout>
  );
} 
