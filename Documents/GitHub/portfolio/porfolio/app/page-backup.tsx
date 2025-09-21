'use client';

import PageLayout from './components/PageLayout';
import { motion } from 'framer-motion';
import { ArrowRight, Brain, Globe, Rocket, Users, Mail, MapPin } from 'lucide-react';
import Image from 'next/image';

/**
 * Home Page
 * 
 * The main landing page featuring a hero section with profile,
 * accelerator programs, and global impact indicators.
 * Located at: app/page.tsx
 */

export default function Home() {
  const highlights = [
    {
      icon: Brain,
      title: 'Learning & Growth',
      description: 'Exploring AI and automation while building practical skills in programming and data analytics',
    },
    {
      icon: Globe,
      title: 'Fintech Focus',
      description: 'Working to make financial services more accessible through technology',
    },
    {
      icon: Rocket,
      title: 'Engineering to Fintech',
      description: 'Transitioning from civil engineering to fintech innovation, bringing infrastructure thinking to financial inclusion challenges',
    },
    {
      icon: Users,
      title: 'AI-Powered Solutions',
      description: 'Combining MBA strategic thinking with cutting-edge AI/ML to build production-ready financial applications',
    },
  ];

  const accelerators = [
    {
      name: 'Brandeis Spark',
      logo: '/images/logos/brandeis-spark-logo.png',
      description: 'Participated in the Brandeis Spark Startup Cohort, receiving guidance and support to develop and launch my startup within the Brandeis University ecosystem.',
      link: 'https://www.brandeis.edu/innovation/grant-programs/spark/index.html'
    },
    {
      name: 'MassChallenge',
      logo: '/images/logos/masschallenge-logo.png',
      description: 'As part of the MassChallenge Early Stage Foundations Cohort, accessed mentorship, resources, and a network to refine entrepreneurial skills and grow ventures.',
      link: 'https://www.masschallenge.org/'
    },
    {
      name: 'Global Venture Labs',
      logo: '/images/logos/global-venture-labs-logo.png',
      description: 'Participated in the Global Venture Labs Accelerator Cohort, gaining valuable insights into entrepreneurship, business strategy, and scaling startups.',
      link: 'https://www.globalventurelabs.org/'
    }
  ];

  const companyLogos = {
    'The Alliance for Climate Transition (ACT)': '/images/logos/ACT Primary Logo Horizontal Black Text Default.svg',
    'Buffr Inc.': '/images/logos/Buffr_Logo.png',
    'Insait IO': '/images/logos/insait_logo.png',
    'Brandeis International Business School': '/images/logos/IBS_logo_stack_center_blue_DIGITAL.png',
    'Polar Power': '/images/logos/polarpower_logo.png',
    'Lithon Project Consultants': '/images/logos/lithon.png',
    'Namibia University of Science & Technology': '/images/logos/nust.png'
  };

  const globalExperience = [
    {
      country: 'Namibia',
      flag: 'na',
      summary: 'Earned my Engineering Degree from NUST and led major infrastructure initiatives at Polar Power, where I spearheaded telecommunications and fiber optic projects for nationwide connectivity. Managed road infrastructure upgrades.'
    },
    {
      country: 'United States',
      flag: 'us',
      summary: 'Completed my MBA at Brandeis International Business School, where I was honored to be selected as a Hassenfeld Fellow for global business immersion. I interned at a trade organization and a climate tech startup.'
    },
    {
      country: 'Israel',
      flag: 'il',
      summary: 'As a Hassenfeld Fellow, I immersed myself in Israel\'s innovative tech ecosystem, visiting groundbreaking companies like Mobileye, Lemonade, and Lightricks, gaining deep insights into AI-driven innovations and startup culture. My cultural journey took me through Jerusalem and Tel Aviv, I interned at predictive analytics startup.'
    },
    {
      country: 'India',
      flag: 'in',
      summary: 'During my Hassenfeld Fellowship, I delved into India\'s diverse business landscape, visiting industry leaders like RJ Corporation (Pepsi bottler), Dabur (FMCG), Bharti Airtel (Telecom), and Mahindra & Mahindra (Automotive). This immersion provided valuable insights into emerging market strategies and frugal innovation approaches.'
    },
    {
      country: 'Germany',
      flag: 'de',
      summary: 'I participated in a transformative Student Exchange Program at FH-Aachen, conducting comparative research on German-Namibian project management practices while gaining extensive exposure to German civil engineering and construction techniques.'
    },
    {
      country: 'United Arab Emirates',
      flag: 'ae',
      summary: 'Served as Sales Manager representing Kanie across key business venues in Dubai, engaging extensively with the Corporate Business Hub and Dubai SME for market expansion initiatives. A highlight was attending the Dubai Expo 2020, where I supported the Namibian pavilion.'
    },
    {
      country: 'South Africa',
      flag: 'za',
      summary: 'Achieved IRATA Level 1 Working at Heights certification while participating in the influential PowerGEN Africa Utility Week. Presented innovative micro-grid solutions for the telecommunications sector and showcased specialized power solutions.'
    },
    {
      country: 'Zambia',
      flag: 'zm',
      summary: 'Established a significant collaboration with NECOR Ltd focused on telecommunications infrastructure development. Led strategic presentations to key stakeholders in the telecommunications sector and developed comprehensive proposals for nationwide site builds.'
    },
    {
      country: 'Tanzania',
      flag: 'tz',
      summary: 'Formed a strategic partnership with Victoria Consolidated Ltd, leading to the development of a comprehensive countrywide telecommunications solution proposal.'
    },
    {
      country: 'Malaysia',
      flag: 'my',
      summary: 'Explored the vibrant city of Kuala Lumpur during a family holiday, experiencing the blend of modern architecture and rich cultural heritage.',
    },
    {
      country: 'Indonesia',
      flag: 'id',
      summary: 'Enjoyed a family vacation in Bali, immersing in the island\'s unique culture and natural beauty.',
    },
  ];

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center text-center"
          >
            {/* Profile Image and Badge */}
            <div className="relative mb-8">
              <div className="relative w-72 h-72 md:w-96 md:h-96 rounded-full overflow-hidden mb-4 ring-4 ring-primary/20">
                <Image
                  src="/images/profile/pendo-avatar.png"
                  alt="George Nekwaya"
                  fill
                  sizes="(max-width: 768px) 288px, 384px"
                  className="object-cover"
                  priority
                />
              </div>
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-base-100 overflow-hidden">
                <div className="relative w-full h-full flex items-center justify-center p-4">
                  <Image
                    src="/images/profile/spark-badge.png"
                    alt="Spark Innovation Badge"
                    fill
                    sizes="128px"
                    className="object-contain p-2"
                  />
                </div>
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              George Nekwaya
            </h1>
            <p className="text-xl md:text-2xl text-base-content/80 mb-4">
              Fintech Innovation Leader & AI Product Architect
            </p>
            <p className="text-lg text-base-content/70 max-w-2xl mb-8">
              Award-winning fintech entrepreneur building production-ready AI-powered financial solutions for Southern Africa. 
              From civil engineering to fintech innovation, transforming financial inclusion through technology.
            </p>
            <div className="flex justify-center gap-4">
              <a href="/experience" className="btn btn-primary">
                View Experience <ArrowRight className="w-4 h-4" />
              </a>
              <a href="mailto:george.n.p.nekwaya@gmail.com" className="btn btn-outline">
                Get in Touch <Mail className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Who I Am Section */}
      <section className="py-20 bg-base-200/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-6">Who I Am</h2>
            <p className="text-lg text-base-content/80 max-w-3xl mx-auto mb-12">
              Originally from Namibia, I completed my MBA with a focus on Data Analytics and Strategy at Brandeis International Business School, 
              where I won the Asper Student Startup Prize for Buffr. My journey from civil engineering to fintech innovation reflects my commitment 
              to solving real-world problems through technology. Currently building production-ready AI-powered financial solutions for Southern Africa, 
              including the award-winning Buffr ecosystem of applications.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {highlights.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="card glass-card h-full"
                >
                  <div className="card-body">
                    <Icon className="w-8 h-8 text-primary mb-4" />
                    <h3 className="card-title">{item.title}</h3>
                    <p className="text-base-content/70">{item.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Accelerator Programs Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Startup Accelerator Programs</h2>
            <p className="text-xl text-base-content/70">
              Supported by leading innovation ecosystems
            </p>
          </motion.div>

          {/* Accelerator Programs Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {accelerators.map((accelerator, index) => (
              <motion.div
                key={accelerator.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="card glass-card h-full"
              >
                <div className="card-body flex flex-col items-center text-center">
                  <div className="w-48 h-24 relative mb-4">
                    <Image
                      src={accelerator.logo}
                      alt={`${accelerator.name} Logo`}
                      fill
                      sizes="(max-width: 768px) 192px, (max-width: 1200px) 192px, 192px"
                      className="object-contain"
                    />
                  </div>
                  <h3 className="card-title">{accelerator.name}</h3>
                  <p className="text-base-content/80 flex-1">{accelerator.description}</p>
                  <div className="card-actions justify-center mt-4">
                    <a
                      href={accelerator.link}
                      className="btn btn-primary btn-outline btn-sm"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Learn More
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Global Impact Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Global Footprint</h2>
            <p className="text-xl text-base-content/70">
              Making an impact across continents through technology and innovation
            </p>
          </motion.div>

          {/* Global Experience Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {globalExperience.map((experience, index) => (
              <motion.div
                key={experience.country}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="card glass-card"
              >
                <div className="card-body">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-8 relative rounded overflow-hidden">
                      <Image
                        src={`https://flagcdn.com/w320/${experience.flag}.png`}
                        alt={`${experience.country} flag`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <h3 className="card-title text-xl flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      {experience.country}
                    </h3>
                  </div>
                  <p className="text-base-content/80 leading-relaxed">
                    {experience.summary}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </PageLayout>
  );
} 