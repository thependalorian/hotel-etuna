'use client';

import PageLayout from '../components/PageLayout';
import { motion } from 'framer-motion';
import { Github, Rocket, TrendingUp, FileSignature, Building } from 'lucide-react';

/**
 * Projects Page
 * 
 * A placeholder page for upcoming projects with GitHub integration.
 * Features animated elements and a call-to-action.
 * Located at: app/projects/page.tsx
 */

export default function Projects() {
  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="relative min-h-[500px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-base-100">
          <div className="absolute inset-0 backdrop-blur-sm"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              Projects
            </h1>
            <p className="text-xl md:text-2xl text-base-content/80 mb-4">
              Technical Innovation & Impact
            </p>
            <p className="text-lg text-base-content/70 max-w-3xl mx-auto mb-8">
              Showcasing my journey in building AI-powered applications, fintech solutions, and data-driven projects that solve real-world problems across emerging markets.
            </p>
            <div className="flex justify-center gap-4">
              <a href="#featured-projects" className="btn btn-accent">
                View Featured Projects
              </a>
              <a href="#highlighted-projects" className="btn btn-outline">
                See All Projects
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-20">

        {/* Featured Projects Section */}
        <section id="featured-projects" className="py-20">
          <div className="max-w-7xl mx-auto px-4">
          <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl font-bold mb-4">Featured Projects</h2>
              <p className="text-xl text-base-content/70">
                Showcasing innovative AI-powered applications and fintech solutions
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* BeerGoggles Project */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="card glass-card overflow-hidden"
              >
                {/* Project Image Placeholder */}
                <div className="w-full h-48 bg-gradient-to-br from-orange-400/20 to-red-500/20 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-sm text-base-content/60">BeerGoggles App Screenshot</p>
                  </div>
                </div>
                <div className="card-body">
                  <h3 className="card-title text-2xl mb-4">BeerGoggles - Smart Beer Recognition App</h3>
                  <p className="mb-4">
                    A fun app that uses your phone's camera to instantly recognize <strong>24+ different Namibian beers</strong> 
                    and tells you interesting facts about them. It can even detect if you're smiling and share more fun information!
                  </p>
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">What it does:</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Point your camera at any Namibian beer and it tells you what it is</li>
                      <li>• Shares fun facts and stories about each beer</li>
                      <li>• Detects your facial expressions to make it more interactive</li>
                      <li>• Works with beers from all over Namibia</li>
                      <li>• Keeps track of which beers you've discovered</li>
                    </ul>
                  </div>
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Built with:</h4>
                    <p className="text-sm">
                      <strong>Smart Camera:</strong> Uses AI to recognize beer bottles instantly<br/>
                      <strong>Fun Facts:</strong> Database of interesting beer information<br/>
                      <strong>Facial Recognition:</strong> Detects smiles and expressions
                    </p>
                  </div>
                  <div className="card-actions justify-center">
                    <span className="badge badge-accent">Camera App</span>
                    <span className="badge badge-secondary">Beer Recognition</span>
                    <span className="badge badge-accent">Namibia</span>
                    <span className="badge badge-neutral">Fun Facts</span>
                  </div>
                </div>
              </motion.div>

              {/* Buffr Payment Companion - Featured */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="card glass-card overflow-hidden"
              >
                {/* Project Image Placeholder */}
                <div className="w-full h-48 bg-gradient-to-br from-blue-400/20 to-purple-500/20 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-sm text-base-content/60">Buffr Payment Companion App</p>
                  </div>
                </div>
                <div className="card-body">
                  <h3 className="card-title text-2xl mb-4">Buffr Payment Companion</h3>
                  <p className="text-lg font-semibold text-white mb-2">"Your Next Payment Companion"</p>
                  <p className="mb-4">
                    A complete mobile banking app that makes sending and receiving money as easy as sending a text message. 
                    Built specifically for young people in Namibia and Southern Africa who want modern, safe, and simple financial services.
                  </p>
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">What it does:</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Send money instantly to friends and family</li>
                      <li>• Pay for things using your phone camera (QR codes)</li>
                      <li>• Get help from an AI assistant for financial questions</li>
                      <li>• Works with Namibian, South African, and Botswanan money</li>
                      <li>• Designed to work even with slow internet connections</li>
                    </ul>
                  </div>
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Built with:</h4>
                    <p className="text-sm">
                      <strong>Mobile App:</strong> Modern iOS app with beautiful design<br/>
                      <strong>Banking System:</strong> Secure connection to real banks<br/>
                      <strong>Smart Features:</strong> AI that helps with money decisions
                    </p>
                  </div>
                  <div className="card-actions justify-center">
                    <span className="badge badge-success">Ready to Launch</span>
                    <span className="badge badge-accent">Mobile Banking</span>
                    <span className="badge badge-secondary">AI Assistant</span>
                    <span className="badge badge-accent">Namibia</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Buffr Product Ecosystem */}
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
                A complete set of smart apps that make money management, business operations, and document signing easier for people and businesses across Southern Africa.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
              {/* BuffrLend */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="card glass-card overflow-hidden"
              >
                {/* Project Image Placeholder */}
                <div className="w-full h-32 bg-gradient-to-br from-green-400/20 to-emerald-500/20 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-xs text-base-content/60">BuffrLend Platform</p>
                  </div>
                </div>
                <div className="card-body">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-success/20 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <h3 className="card-title text-xl">BuffrLend</h3>
                      <p className="text-sm text-base-content/60">B2B2C Lending Platform</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-white mb-2">"Smart Loans, Simple Process"</p>
                  <p className="mb-4">
                    Complete B2B2C lending platform with comprehensive authentication, loan processing, KYC verification, and admin dashboard. Built for partner employers and their permanent employees with salary deduction model.
                  </p>
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2 text-sm">What it does:</h4>
                    <ul className="text-xs space-y-1">
                      <li>• Multi-step loan application with real-time validation</li>
                      <li>• AI-powered document processing (ID, payslips, bank statements)</li>
                      <li>• Real-time loan calculator with transparent fee breakdown</li>
                      <li>• Comprehensive admin dashboard with CRM system</li>
                      <li>• NAMFISA compliance tracking and audit trails</li>
                    </ul>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="badge badge-success badge-sm">B2B2C</span>
                    <span className="badge badge-accent badge-sm">AI KYC</span>
                    <span className="badge badge-secondary badge-sm">Salary Deduction</span>
                    <span className="badge badge-accent badge-sm">NAMFISA Compliant</span>
                  </div>
                  <div className="card-actions justify-end">
                    <a href="https://lend.buffr.ai" target="_blank" rel="noopener noreferrer" className="btn btn-success btn-sm">
                      View Live
                    </a>
                  </div>
                </div>
              </motion.div>

              {/* BuffrSign */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="card glass-card overflow-hidden"
              >
                {/* Project Image Placeholder */}
                <div className="w-full h-32 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-xs text-base-content/60">BuffrSign Platform</p>
                  </div>
                </div>
                <div className="card-body">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-warning/20 rounded-lg flex items-center justify-center">
                      <FileSignature className="w-6 h-6 text-warning" />
                    </div>
                    <div>
                      <h3 className="card-title text-xl">BuffrSign</h3>
                      <p className="text-sm text-base-content/60">AI Digital Signature Platform</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-white mb-2">"Get Documents Signed in Minutes, Not Days"</p>
                  <p className="mb-4">
                    Advanced AI-powered digital signature platform with LlamaIndex + LangGraph + Pydantic AI. 
                    Features intelligent document processing, compliance validation, and secure signature workflows with 29 legal documents knowledge base.
                  </p>
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2 text-sm">What it does:</h4>
                    <ul className="text-xs space-y-1">
                      <li>• LlamaIndex document intelligence with semantic search</li>
                      <li>• LangGraph workflow orchestration and state management</li>
                      <li>• Pydantic AI validation with structured data processing</li>
                      <li>• OCR + Computer Vision for text extraction</li>
                      <li>• ETA 2019 compliance with 29 legal documents</li>
                      <li>• Neo4j knowledge graph for entity relationships</li>
                    </ul>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="badge badge-warning badge-sm">LlamaIndex</span>
                    <span className="badge badge-accent badge-sm">LangGraph</span>
                    <span className="badge badge-secondary badge-sm">Pydantic AI</span>
                    <span className="badge badge-accent badge-sm">ETA 2019 Compliant</span>
                  </div>
                  <div className="card-actions justify-end">
                    <a href="https://sign.buffr.ai" target="_blank" rel="noopener noreferrer" className="btn btn-warning btn-sm">
                      View Live
                    </a>
                  </div>
                </div>
              </motion.div>


              {/* Buffr Host (The Shandi) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="card glass-card overflow-hidden"
              >
                {/* Project Image Placeholder */}
                <div className="w-full h-32 bg-gradient-to-br from-purple-400/20 to-pink-500/20 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-xs text-base-content/60">Buffr Host Platform</p>
                  </div>
                </div>
                <div className="card-body">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center">
                      <Building className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="card-title text-xl">Buffr Host</h3>
                      <p className="text-sm text-base-content/60">Hospitality Management Platform</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-white mb-2">"The Future of Hospitality, Today"</p>
                  <p className="mb-4">
                    Comprehensive cloud-based hospitality ecosystem management platform combining CRM-driven customer engagement, 
                    AI-powered business intelligence, and streamlined operational tools for restaurants, hotels, spas, and all hospitality amenities.
                  </p>
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2 text-sm">What it does:</h4>
                    <ul className="text-xs space-y-1">
                      <li>• Complete admin dashboard with real-time statistics</li>
                      <li>• Room, menu, staff, and booking management systems</li>
                      <li>• Inventory management with low-stock alerts</li>
                      <li>• Digital menu with QR code access and multi-language support</li>
                      <li>• Cross-business loyalty programs and point redemption</li>
                      <li>• AI-driven business intelligence and performance metrics</li>
                    </ul>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="badge badge-accent badge-sm">Hospitality</span>
                    <span className="badge badge-accent badge-sm">AI Analytics</span>
                    <span className="badge badge-secondary badge-sm">Multi-Service</span>
                    <span className="badge badge-neutral badge-sm">CRM</span>
                  </div>
                  <div className="card-actions justify-end">
                    <a href="https://host.buffr.ai" target="_blank" rel="noopener noreferrer" className="btn btn-accent btn-sm">
                      View Live
                    </a>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Projects Section */}
        <section id="highlighted-projects" className="py-20 bg-base-200/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl font-bold mb-4">Highlighted Projects</h2>
              <p className="text-xl text-base-content/70">
                Showcasing impactful projects that demonstrate my skills and insights in fintech and social innovation.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="card glass-card overflow-hidden"
              >
                {/* Project Image Placeholder */}
                <div className="w-full h-40 bg-gradient-to-br from-blue-400/20 to-cyan-500/20 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-sm text-base-content/60">AMD Stock Analysis Dashboard</p>
                  </div>
                </div>
                <div className="card-body">
                  <h3 className="card-title text-2xl mb-4">Time Series Analysis on AMD Stock Prices</h3>
                  <p>
                    Conducted a comprehensive analysis of the influence of news sentiment on AMD stock prices from 1984 to 2024. 
                    Utilizing time series techniques, I examined 159 daily observations and 473 monthly observations, revealing 
                    significant predictive relationships. The findings indicated that daily news sentiment had a stronger impact 
                    on stock returns than annual report sentiment, with the 7-day moving average emerging as the most important 
                    predictor for forecasting stock prices.
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="card glass-card overflow-hidden"
              >
                {/* Project Image Placeholder */}
                <div className="w-full h-40 bg-gradient-to-br from-green-400/20 to-teal-500/20 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-sm text-base-content/60">Airbnb Market Analysis</p>
                  </div>
                </div>
                <div className="card-body">
                  <h3 className="card-title text-2xl mb-4">Airbnb Listings Analysis</h3>
                  <p>
                    Analyzed two Kaggle datasets comprising 458,177 Airbnb listings from 2020 and 2023 to assess the impact 
                    of the COVID-19 pandemic on the rental market. The analysis revealed average prices between $200 and $300 
                    per night and identified the most booked unit types, providing crucial insights for potential investors 
                    looking to navigate the recovering market.
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="card glass-card overflow-hidden"
              >
                {/* Project Image Placeholder */}
                <div className="w-full h-40 bg-gradient-to-br from-purple-400/20 to-indigo-500/20 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-sm text-base-content/60">P2P Lending ML Model</p>
                  </div>
                </div>
                <div className="card-body">
                  <h3 className="card-title text-2xl mb-4">Machine Learning in Peer-to-Peer Lending</h3>
                  <p>
                    Developed predictive models for optimizing loan investments in peer-to-peer lending, analyzing over 
                    1.8 million loans worth $15 billion. The project identified a 13.5% default rate and interest rates ranging 
                    from 6.7% to 22.8%. I implemented three return calculation methods, finding that the optimistic method 
                    yielded the highest returns, albeit with increased risk. This project demonstrated the effectiveness of 
                    data-driven strategies in investment decisions and confirmed that recent data models consistently outperformed 
                    random selections.
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="card glass-card overflow-hidden"
              >
                {/* Project Image Placeholder */}
                <div className="w-full h-40 bg-gradient-to-br from-emerald-400/20 to-green-500/20 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-sm text-base-content/60">Kit Star Aquaponics</p>
                  </div>
                </div>
                <div className="card-body">
                  <h3 className="card-title text-2xl mb-4">Kit Star - #DeisHacks2023</h3>
                  <p>
                    Kit Star is a custom shipping containerized aquaponics and organic vertical farm solution. This project 
                    creates a symbiotic relationship between fish and plants, reducing waste and producing fresh, healthy produce. 
                    The vertical farm setup optimizes the use of space within the container, maximizing harvest potential and 
                    providing a sustainable food production system.
                  </p>
                  <p>
                    The inspiration for Kit Star came from the challenges faced by The Land's Sake Farm and similar organizations 
                    in sustainable agriculture. We aimed to address limited space and resources while revolutionizing their operations.
                  </p>
                  <p>
                    One of the biggest challenges was creating a sustainable closed-loop system between the fish and plants. 
                    We learned the importance of optimizing space while ensuring a healthy environment for both.
                  </p>

                  <div className="card-actions justify-center mt-4">
                    <a
                      href="https://devpost.com/software/kit-star"
                      className="btn btn-accent btn-outline btn-sm"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View on Devpost
                    </a>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="card glass-card overflow-hidden"
              >
                {/* Project Image Placeholder */}
                <div className="w-full h-40 bg-gradient-to-br from-red-400/20 to-pink-500/20 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-sm text-base-content/60">FRONT-AI Healthcare</p>
                  </div>
                </div>
                <div className="card-body">
                  <h3 className="card-title text-2xl mb-4">FRONT-AI - #DeisHacks2024</h3>
                  <p>
                    FRONT-AI addresses the complex challenges in healthcare data management, particularly in complying with HIPAA regulations. 
                    This project simplifies the management of sensitive patient data for healthcare organizations, ensuring compliance while 
                    being user-friendly.
                  </p>
                  <p>
                    We built a specialized hardware device capable of operating offline for maximum security, integrating a custom-trained 
                    Large Language Model (FRONT-LLM) to process healthcare data in accordance with HIPAA guidelines.
                  </p>

                  <div className="card-actions justify-center mt-4">
                    <a
                      href="https://devpost.com/software/front-ai"
                      className="btn btn-accent btn-outline btn-sm"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View on Devpost
                    </a>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </div>
    </PageLayout>
  );
} 
