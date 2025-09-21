'use client';

import PageLayout from '../components/PageLayout';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Mountain, Sun, Compass, Camera, Star } from 'lucide-react';

/**
 * Namibia Page
 * 
 * Showcases Namibia's natural wonders, history, and sustainable initiatives.
 * Features interactive cards and visual elements.
 * Located at: app/namibia/page.tsx
 */

interface LocationCard {
  title: string;
  description: string;
  image: string;
  icon: typeof Mountain;
}

interface VideoContent {
  title: string;
  description: string;
  youtubeUrl: string;
}

const videos: VideoContent[] = [
  {
    title: 'Namibia: A Land of Contrast',
    description: 'Experience the diverse landscapes and natural wonders that make Namibia a unique destination.',
    youtubeUrl: 'https://www.youtube.com/embed/ERImr_uJOhQ'
  },
  {
    title: 'Top 5 Must-See Places',
    description: 'Discover the most breathtaking destinations and experiences that Namibia has to offer visitors.',
    youtubeUrl: 'https://www.youtube.com/embed/m_wGSJi3cbE'
  }
];

const locations: LocationCard[] = [
  {
    title: 'Sossusvlei Sand Dunes',
    description: 'Towering red sand dunes in the heart of the Namib Desert, some reaching heights of over 300 meters. The striking contrast of the orange-red sand against the blue sky creates an otherworldly landscape.',
    image: '/images/namibia/namibia_soussosvlei.jpeg',
    icon: Mountain,
  },
  {
    title: 'Namib Desert Adventures',
    description: 'One of the world\'s oldest deserts, offering thrilling activities like quad biking, camel riding at sunset, and sandboarding down massive dunes.',
    image: '/images/namibia/namibia_desert.jpeg',
    icon: Compass,
  },
  {
    title: 'Swakopmund',
    description: 'A charming coastal town with German colonial architecture, adventure activities like skydiving, and excellent seafood. The perfect mix of culture and adrenaline.',
    image: '/images/namibia/swakopmund.jpg',
    icon: Sun,
  },
  {
    title: 'Epupa Falls',
    description: 'Located on the Kunene River along the Angola-Namibia border, featuring a series of cascades in a landscape of baobabs and makalani palms.',
    image: '/images/namibia/namibia_epupafalls.jpeg',
    icon: Camera,
  },
  {
    title: 'Etosha National Park',
    description: 'A premier wildlife sanctuary centered around a vast salt pan. Renowned for incredible wildlife viewing opportunities, especially during the dry season.',
    image: '/images/namibia/etosha_national_park.jpeg',
    icon: Camera,
  },
  {
    title: 'Stargazing Paradise',
    description: 'Namibia offers some of the darkest skies in the world, making it a premier destination for stargazing. The clear desert air and minimal light pollution provide perfect conditions for viewing the Milky Way in all its glory.',
    image: '/images/namibia/epepa_camping_milkyway.jpeg',
    icon: Star,
  }
];

export default function Namibia() {
  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[500px] overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/namibia/namibia.jpeg"
            alt="Namibian landscape"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-base-300/50 to-base-100">
            <div className="absolute inset-0 backdrop-blur-sm"></div>
          </div>
        </div>
        <div className="relative h-full flex items-center justify-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto px-4"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">
              My Beautiful Country: Namibia
            </h1>
            <p className="text-xl md:text-2xl text-white/80">
              A land of vast landscapes, rich cultures, and boundless potential
            </p>
          </motion.div>
        </div>
      </section>

      {/* History Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="prose max-w-none mb-12"
          >
            <h2 className="text-3xl font-bold mb-6">History & Etymology</h2>
            <p className="text-lg text-base-content/80">
              The name "Namibia" is derived from the Namib Desert, with "Namib" meaning "vast place" in the Nama language.
              The region's history is marked by the presence of indigenous groups such as the San, Nama, and Ovambo peoples.
              In the late 19th century, Namibia became a German colony known as German South West Africa.
              Following World War I, it was administered by South Africa under a League of Nations mandate.
              After a prolonged struggle for independence, Namibia gained sovereignty on March 21, 1990.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Natural Wonders Section */}
      <section className="py-20 bg-base-200/50">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-6">Natural Wonders</h2>
            <p className="text-xl text-base-content/70">
              Discover Namibia's breathtaking landscapes and natural attractions
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {locations.map((location, index) => {
              const Icon = location.icon;
              return (
                <motion.div
                  key={location.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="h-full"
                >
                  <div className="card glass-card h-full">
                    <figure className="px-4 pt-4">
                      <div className="relative w-full h-[250px] rounded-xl overflow-hidden">
                        <Image
                          src={location.image}
                          alt={location.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                    </figure>
                    <div className="card-body flex flex-col justify-between flex-1">
                      <div>
                        <h3 className="card-title flex items-center gap-2">
                          <Icon className="w-5 h-5 text-accent" />
                          {location.title}
                        </h3>
                        <p className="text-base-content/80">{location.description}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Video Showcase Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-6">Experience Namibia</h2>
            <p className="text-xl text-base-content/70">
              Immerse yourself in the beauty and culture of Namibia through these curated videos
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {videos.map((video, index) => (
              <motion.div
                key={video.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="h-full"
              >
                <div className="card glass-card h-full">
                  <div className="aspect-video w-full">
                    <iframe
                      className="w-full h-full rounded-t-xl"
                      src={video.youtubeUrl}
                      title={video.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      loading="lazy"
                      style={{ border: 0 }}
                    />
                  </div>
                  <div className="card-body flex flex-col justify-between flex-1">
                    <div>
                      <h3 className="card-title">{video.title}</h3>
                      <p className="text-base-content/80">{video.description}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Sustainable Development Section */}
      <section className="py-20 bg-base-200/50">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-6">Sustainable Development Initiatives</h2>
            <p className="text-xl text-base-content/70">
              Namibia is pioneering sustainable development in Africa through innovative projects
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card glass-card h-full">
              <div className="card-body flex flex-col justify-between flex-1">
                <div>
                  <h3 className="card-title">Green Hydrogen Project</h3>
                  <p className="text-base-content/80 mb-4">
                    A $10 billion initiative to harness Namibia's abundant solar and wind resources to produce
                    green hydrogen, positioning the country as a leader in renewable energy.
                  </p>
                </div>
                <div className="aspect-video w-full mt-auto">
                  <iframe
                    className="w-full h-full rounded-xl"
                    src="https://www.youtube.com/embed/sDvBO0siXKQ"
                    title="Namibia's Ambitious Green Hydrogen Project"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                    style={{ border: 0 }}
                  />
                </div>
              </div>
            </div>

            <div className="card glass-card h-full">
              <div className="card-body flex flex-col justify-between flex-1">
                <div>
                  <h3 className="card-title">Financial Innovation</h3>
                  <p className="text-base-content/80 mb-4">
                    The Bank of Namibia's Instant Payment Project aims to revolutionize financial services
                    and increase financial inclusion throughout the country.
                  </p>
                </div>
                <div className="aspect-video w-full mt-auto">
                  <iframe
                    className="w-full h-full rounded-xl"
                    src="https://www.youtube.com/embed/61WsDB3GxyU"
                    title="Bank of Namibia's Financial Innovation"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                    style={{ border: 0 }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
} 