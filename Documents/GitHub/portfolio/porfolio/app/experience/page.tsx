'use client';

import PageLayout from '../components/PageLayout';
import { motion } from 'framer-motion';
import { Briefcase, Building2, GraduationCap } from 'lucide-react';
import Image from 'next/image';

/**
 * Experience Page
 * 
 * A chronological timeline of professional roles and educational achievements.
 * Features animated cards and interactive elements.
 * Located at: app/experience/page.tsx
 */

interface TimelineItem {
  title: string;
  company: string;
  period: string;
  description: string[];
  type: 'work' | 'education';
  icon: typeof Briefcase | typeof GraduationCap;
}

const timelineData: TimelineItem[] = [
  {
    title: 'Founder',
    company: 'Buffr',
    period: 'Jan 2023 - Present',
    description: [
      'Founded digital financial inclusion startup inspired by global payment systems like India\'s UPI',
      'Conducted comprehensive field studies on digital payment ecosystems across multiple countries',
      'Developed infrastructure for instant payment solutions to improve financial accessibility in emerging markets (Buffr Payment Companion)',
      'Developed AI-assisted lending platform (BuffrLend) with B2B2C focus and salary deduction model',
      'Developed intuitive digital signature platform with audit trail (BuffrSign) using LlamaIndex + LangGraph + Pydantic AI',
      'Created Buffr Host: AI-powered hospitality management platform with voice AI and RAG systems',
      'Skills: AI/ML (Pydantic AI, LlamaIndex, LangGraph), Full-Stack Development, Financial Technology, Market Research, Strategic Planning, Team Leadership'
    ],
    type: 'work',
    icon: Building2
  },
  {
    title: 'Project Manager, DEIJ & Workforce Development',
    company: 'The Alliance for Climate Transition (ACT)',
    period: 'Oct 2024 - June 2025',
    description: [
      'Lead workforce development assessment in partnership with MassCEC, focusing on clean energy sector hiring needs',
      'Collaborate with educational institutions to enhance student engagement in clean energy programs',
      'Develop strategies to increase diversity and inclusion in the clean energy workforce',
      'Skills: Project Management, Workforce Development, DEIJ Strategies, Clean Energy, Strategic Planning'
    ],
    type: 'work',
    icon: Briefcase
  },
  {
    title: 'Business Development Consultant',
    company: 'Aquasaic Corporation (Remote)',
    period: 'Oct 2024 - Mar 2025',
    description: [
      'Conducted comprehensive commercial and technical research on cutting-edge water treatment technologies',
      'Designed the initial architecture for the Aquasaic-water-platform, focusing on democratizing access to water quality data using AI and machine learning',
      'Led the development of pitch decks tailored for different funding opportunities',
      'Skills: Technical Research, Product Development, Marketing Strategy, AI/ML Integration'
    ],
    type: 'work',
    icon: Briefcase
  },
  {
    title: 'Business Development',
    company: 'Insait IO',
    period: 'June 2023 - July 2023',
    description: [
      'Analyzed financial data from Valley National Bank, identifying real estate loans as key revenue driver',
      'Conducted comprehensive research on emerging banking trends and competitive product offerings',
      'Developed compliance framework for AI applications in finance',
      'Delivered strategic recommendations presentation to senior leadership team',
      'Skills: Market Research, Financial Analysis, Regulatory Compliance, AI Ethics'
    ],
    type: 'work',
    icon: Briefcase
  },
  {
    title: 'Master of Business Administration (STEM-Designated)',
    company: 'Brandeis International Business School',
    period: '2022 - 2024',
    description: [
      'Concentrations: Data Analytics, Strategy & Innovation | GPA: 3.45/4.0',
      'Founded Buffr, winning 2023 Asper Student Startup Award',
      'Awarded Hassenfeld Fellowship for global markets exchange in Israel & India',
      'Led International Business School Student Association to "2023 Student Group of the Year"',
      'Received 2023 Student Choice for Community Engagement and 2024 Prime Liaison Recognition',
      'Served as Vice President of the International Business School Student Association',
      'Selected as Instructional Assistant for Social Impact Investing and MBA Communication courses'
    ],
    type: 'education',
    icon: GraduationCap
  },
  {
    title: 'Sales Representative',
    company: 'Kanie Distribution and Supply Chain',
    period: '2020 - 2021',
    description: [
      'Represented company at Dubai Expo 2020, the world\'s biggest business networking conference',
      'Presented at Namibia\'s 4th Industrial Revolution Expo in Windhoek',
      'Provided training to government officials on drone applications',
      'Developed strategic partnerships and expanded market presence',
      'Skills: International Business Development, Government Relations, Technical Training'
    ],
    type: 'work',
    icon: Briefcase
  },
  {
    title: 'Business Operations Manager',
    company: 'Polar Power',
    period: '2018 - 2020',
    description: [
      'Managed team of 10+ employees in Namibian Office for multinational telecommunications and renewable energy company',
      'Built and managed relationships with major telecom clients (MTC, MTN) and SADC government officials',
      'Oversaw implementation of nationwide telecom tower construction projects and managed subcontractors',
      'Managed optical fiber installation project in Swakopmund, Namibia',
      'Led successful business operations until pursuing further education',
      'Skills: Team Leadership, Project Management, Client Relations, Infrastructure Development, Subcontractor Management'
    ],
    type: 'work',
    icon: Briefcase
  },
  {
    title: 'Operations & General Manager',
    company: 'Etuna Guesthouse & Tours',
    period: '2010 - 2020',
    description: [
      'Managed operations of family-owned 35-room establishment with 12 staff members',
      'Developed strategies for business scaling and operational efficiency',
      'Led marketing efforts and customer outreach initiatives',
      'Improved customer satisfaction through enhanced dining experience',
      'Gained comprehensive understanding of hospitality industry operations',
      'Skills: Hospitality Management, Operations, Marketing, Customer Service'
    ],
    type: 'work',
    icon: Briefcase
  },
  {
    title: 'Volunteer Work',
    company: 'Various Organizations',
    period: '2020 - 2022',
    description: [
      'New Elementary Namibia: Collected and distributed educational materials, food, and clothes for impoverished schools',
      'Global Entrepreneurship Network Namibia: Developed \'Zizza Makazi\' green hydrogen concept for HDF Energy',
      'Contributed to school refurbishment projects to improve early education standards',
      'Actively participated in community development and educational initiatives',
      'Skills: Community Service, Project Development, Social Impact'
    ],
    type: 'work',
    icon: Briefcase
  },
  {
    title: 'Site Agent\'s Assistant',
    company: 'Namibia Road Products & Services',
    period: '2017 - 2018',
    description: [
      'Directed road construction team of 15 workers, completing 3.5 km of road upgrade project',
      'Established effective communication channels with municipal stakeholders',
      'Led road construction operations and managed on-site teams for municipal infrastructure projects',
      'Skills: Project Coordination, Municipal Infrastructure, Team Leadership, Materials Management'
    ],
    type: 'work',
    icon: Briefcase
  },
  {
    title: 'Civil Engineering Intern',
    company: 'Lithon Project Consultants',
    period: '2016 - 2017',
    description: [
      'Evaluated 15+ tender documents, ensuring compliance with Namibian standards',
      'Conducted site inspections and assessments for stormwater infrastructure projects',
      'Assisted with administrative tasks and documentation',
      'Skills: Civil Engineering, Site Assessment, Administrative support'
    ],
    type: 'work',
    icon: Briefcase
  },
  {
    title: 'Bachelor of Engineering in Civil & Environmental Engineering',
    company: 'Namibia University of Science & Technology',
    period: '2013 - 2017',
    description: [
      'Designed comprehensive water tower system for Kalkrand township as capstone project',
      'Participated in Student Exchange Program at FH-Aachen, Germany (Project Management)',
      'Led Engineering Students Association committee initiatives',
      'Comprehensive engineering education with focus on sustainable infrastructure',
      'Developed cross-cultural communication skills through collaboration with German counterparts'
    ],
    type: 'education',
    icon: GraduationCap
  },
  {
    title: 'High School Diploma',
    company: 'Oshigambo High School',
    period: '2004 - 2008',
    description: [
      'Completed secondary education at one of Namibia\'s prestigious high schools',
      'Founded and led the school\'s Science Club, fostering interest in scientific exploration',
      'Established and organized an unofficial Chess Club, demonstrating early leadership initiative',
      'Built strong foundation in mathematics and sciences',
      'Developed leadership and academic skills that supported future engineering studies'
    ],
    type: 'education',
    icon: GraduationCap
  }
];

export default function Experience() {
  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Professional Journey</h1>
          <p className="text-xl text-base-content/70">
            A timeline of my career milestones and educational achievements
          </p>
        </motion.div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-0 md:left-1/2 h-full w-px bg-primary/20 transform -translate-x-1/2"></div>

          {/* Timeline items */}
          <div className="space-y-12">
            {timelineData.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`relative flex items-center ${
                    index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  {/* Timeline dot */}
                  <div className="absolute left-0 md:left-1/2 w-8 h-8 bg-primary rounded-full transform -translate-x-1/2 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary-content" />
                  </div>

                  {/* Content card */}
                  <div className={`ml-12 md:ml-0 md:w-1/2 ${
                    index % 2 === 0 ? 'md:pr-12' : 'md:pl-12'
                  }`}>
                    <div className="card glass-card">
                      <div className="card-body">
                        <h3 className="card-title text-2xl">{item.title}</h3>
                        <div className="flex items-center gap-2 text-base-content/70">
                          <span>{item.company}</span>
                          <span>•</span>
                          <span>{item.period}</span>
                        </div>
                        <ul className="mt-4 space-y-2">
                          {item.description.map((desc, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                              <span>{desc}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </PageLayout>
  );
} 