import React from 'react';
import { motion } from 'framer-motion';
import { Target, Eye, Users, Heart, Linkedin } from 'lucide-react';

// Animation variants for Framer Motion
const sectionVariant = {
  hidden: { opacity: 0, y: 50 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.6,
      ease: "easeOut",
      staggerChildren: 0.2
    }
  }
};

const itemVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const About = () => {
  // Mock data for the team
  const teamMembers = [
    {
      name: 'Jane Doe',
      role: 'Founder & CEO',
      imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      bio: 'A former model and tech enthusiast, Jane founded ModelConnect to bridge the gap between talent and industry professionals.'
    },
    {
      name: 'John Smith',
      role: 'Lead Developer',
      imageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
      bio: 'John is the architect behind our seamless platform, ensuring a robust and user-friendly experience for everyone.'
    },
    {
      name: 'Emily White',
      role: 'Head of Talent Relations',
      imageUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=400&q=80',
      bio: 'Emily works tirelessly to build partnerships and ensure our models and recruiters have the support they need to succeed.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Hero Section */}
      <motion.section 
        className="bg-white py-20 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-4xl mx-auto px-6">
          <Target className="mx-auto text-pink-500 mb-4" size={48} />
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900">Our Mission</h1>
          <p className="mt-4 text-lg text-gray-600">
            To empower aspiring models and streamline the discovery process for industry professionals, creating a transparent, efficient, and supportive global network.
          </p>
        </div>
      </motion.section>

      {/* Our Story Section */}
      <motion.section 
        className="py-20 px-6"
        variants={sectionVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <motion.div variants={itemVariant}>
            <img 
              src="https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=800&q=80" 
              alt="Team working together" 
              className="rounded-xl shadow-lg w-full"
            />
          </motion.div>
          <motion.div variants={itemVariant}>
            <h2 className="text-4xl font-bold mb-4">The Story of ModelConnect</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              ModelConnect was born from a simple idea: the modeling industry needed a modern update. Our founder, a former model, experienced firsthand the challenges of getting noticed and the lack of a centralized, trustworthy platform to connect with legitimate agencies.
            </p>
            <p className="text-gray-600 leading-relaxed">
              We set out to build more than just a catalogue; we wanted to create a community. A place where talent can be nurtured, opportunities are accessible, and connections are meaningful. Today, ModelConnect is a thriving ecosystem that champions diversity, professionalism, and success for all its members.
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Our Values Section */}
      <motion.section 
        className="bg-white py-20 px-6"
        variants={sectionVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <div className="text-center mb-12 max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold">Our Core Values</h2>
          <p className="mt-2 text-gray-500">The principles that guide every decision we make.</p>
        </div>
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
          <motion.div variants={itemVariant} className="p-8 text-center">
            <Eye className="mx-auto text-pink-500 mb-4" size={48} />
            <h3 className="text-xl font-semibold mb-2">Transparency</h3>
            <p className="text-gray-600">We believe in open communication and clear processes, ensuring there are no hidden barriers to success.</p>
          </motion.div>
          <motion.div variants={itemVariant} className="p-8 text-center">
            <Users className="mx-auto text-pink-500 mb-4" size={48} />
            <h3 className="text-xl font-semibold mb-2">Community</h3>
            <p className="text-gray-600">We foster a supportive network where models and recruiters can connect, collaborate, and grow together.</p>
          </motion.div>
          <motion.div variants={itemVariant} className="p-8 text-center">
            <Heart className="mx-auto text-pink-500 mb-4" size={48} />
            <h3 className="text-xl font-semibold mb-2">Integrity</h3>
            <p className="text-gray-600">We are committed to the highest standards of professionalism and safety for all members of our platform.</p>
          </motion.div>
        </div>
      </motion.section>

      {/* Meet the Team Section */}
      <motion.section 
        className="py-20 px-6"
        variants={sectionVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <div className="text-center mb-12 max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold">Meet the Team</h2>
          <p className="mt-2 text-gray-500">The passionate individuals behind ModelConnect.</p>
        </div>
        <div className="max-w-7xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {teamMembers.map((member, index) => (
            <motion.div 
              key={index} 
              className="bg-white rounded-xl shadow-lg text-center p-8 group transform hover:-translate-y-2 transition-transform duration-300"
              variants={itemVariant}
            >
              <img 
                src={member.imageUrl} 
                alt={member.name} 
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover ring-4 ring-pink-200 group-hover:ring-pink-400 transition-all"
              />
              <h3 className="text-2xl font-semibold">{member.name}</h3>
              <p className="text-pink-500 font-medium mb-2">{member.role}</p>
              <p className="text-gray-600 text-sm mb-4">{member.bio}</p>
              <a href="#" className="text-pink-600 hover:text-pink-800 transition">
                <Linkedin size={24} className="mx-auto"/>
              </a>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </div>
  );
};

export default About;
