import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, UserCheck, Star, ArrowRight, TrendingUp, ShieldCheck, Award, MapPin } from 'lucide-react';

// Animation variants for Framer Motion
const sectionVariant = {
  hidden: { opacity: 0, y: 50 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.6,
      ease: "easeOut" 
    }
  }
};

const cardVariant = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.5
    }
  }
};

const Home = () => {
  // Updated mock data with more professional model images
  const featuredModels = [
    { name: 'Alexina', imageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80' },
    { name: 'Ricardo', imageUrl: 'https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?auto=format&fit=crop&w=400&q=80' },
    { name: 'Chloe', imageUrl: 'https://images.unsplash.com/photo-1617922001434-c7a435bd8587?auto=format&fit=crop&w=400&q=80' },
  ];

  const testimonials = [
    { quote: 'ModelConnect launched my career! I was discovered by a top agency within a month.', name: 'Elena', role: 'Fashion Model' },
    { quote: 'The best platform for finding fresh, diverse talent. The search tools are fantastic.', name: 'David Chen', role: 'Casting Director' },
  ];
  
  const trendingLocations = [
    { name: 'Paris', imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760c0337?auto=format&fit=crop&w=400&q=80' },
    { name: 'New York', imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=400&q=80' },
    { name: 'Milan', imageUrl: 'https://images.unsplash.com/photo-1599599810703-76c273a5005b?auto=format&fit=crop&w=400&q=80' },
    { name: 'Tokyo', imageUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=400&q=80' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Hero Section */}
      <section className="relative bg-white">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 items-center">
            <div className="px-6 py-24 md:py-32 text-center lg:text-left">
                 <motion.div 
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  >
                    <h1 className="text-5xl md:text-7xl font-extrabold leading-tight">
                      Where Talent <span className="text-pink-500">Meets</span> Opportunity
                    </h1>
                    <p className="mt-6 text-lg text-gray-600 max-w-xl mx-auto lg:mx-0">
                      The premier destination for models to showcase their portfolio and for recruiters to discover the next face of their campaign.
                    </p>
                    <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Link to="/register" className="flex items-center justify-center w-full sm:w-auto px-8 py-4 bg-pink-600 text-white rounded-lg font-semibold shadow-lg hover:bg-pink-700 transition-all duration-300">
                          Create Your Portfolio <ArrowRight className="ml-2" size={20} />
                        </Link>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Link to="/catalogue" className="flex items-center justify-center w-full sm:w-auto px-8 py-4 bg-white text-pink-600 border-2 border-pink-500 rounded-lg font-semibold hover:bg-pink-50 transition-all duration-300">
                          Explore Models
                        </Link>
                      </motion.div>
                    </div>
                  </motion.div>
            </div>
            <div className="hidden lg:block h-full max-h-[640px]">
                <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80" alt="Fashion Model" className="w-full h-full object-cover" />
            </div>
        </div>
      </section>

      {/* Features Section */}
      <motion.section 
        className="py-20 px-6 max-w-7xl mx-auto"
        variants={sectionVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold">Why Choose ModelConnect?</h2>
          <p className="mt-2 text-gray-500">Everything you need to get noticed or find talent.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-8 bg-white rounded-xl shadow-md text-center hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
            <TrendingUp className="mx-auto text-pink-500 mb-4" size={48} />
            <h3 className="text-xl font-semibold mb-2">Boost Your Career</h3>
            <p className="text-gray-600">Gain visibility with top-tier agencies and brands actively seeking new talent.</p>
          </div>
          <div className="p-8 bg-white rounded-xl shadow-md text-center hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
            <ShieldCheck className="mx-auto text-pink-500 mb-4" size={48} />
            <h3 className="text-xl font-semibold mb-2">Safe & Secure</h3>
            <p className="text-gray-600">We verify recruiters to ensure a safe and professional environment for all our models.</p>
          </div>
          <div className="p-8 bg-white rounded-xl shadow-md text-center hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
            <Award className="mx-auto text-pink-500 mb-4" size={48} />
            <h3 className="text-xl font-semibold mb-2">Curated Talent</h3>
            <p className="text-gray-600">Recruiters can easily browse our diverse and high-quality catalogue of professional models.</p>
          </div>
        </div>
      </motion.section>

      {/* How It Works Section */}
      <motion.section 
        className="bg-white py-20 px-6"
        variants={sectionVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-12">Get Started in 3 Easy Steps</h2>
          <div className="grid md:grid-cols-3 gap-10 relative">
            {/* Dashed line for desktop */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-gray-300 border-t-2 border-dashed -translate-y-12"></div>
            <div className="relative z-10">
              <div className="bg-pink-500 text-white w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">1</div>
              <h3 className="text-xl font-semibold">Create Your Profile</h3>
              <p className="text-gray-600 mt-2">Sign up and build a stunning portfolio with your best photos and details.</p>
            </div>
            <div className="relative z-10">
              <div className="bg-pink-500 text-white w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">2</div>
              <h3 className="text-xl font-semibold">Get Discovered</h3>
              <p className="text-gray-600 mt-2">Your profile becomes visible to our network of verified recruiters and agencies.</p>
            </div>
            <div className="relative z-10">
              <div className="bg-pink-500 text-white w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">3</div>
              <h3 className="text-xl font-semibold">Land Your Dream Job</h3>
              <p className="text-gray-600 mt-2">Connect with industry professionals and start your modeling career.</p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Featured Models Section */}
      <motion.section 
        className="py-20 px-6 max-w-7xl mx-auto"
        variants={sectionVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold">Featured Models</h2>
          <p className="mt-2 text-gray-500">A glimpse of the incredible talent on our platform.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredModels.map((model, index) => (
            <motion.div 
              key={index} 
              className="group relative overflow-hidden rounded-xl shadow-lg"
              variants={cardVariant}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
            >
              <img src={model.imageUrl} alt={model.name} className="w-full h-96 object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-6">
                <h3 className="text-2xl font-semibold text-white">{model.name}</h3>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Trending Locations Section */}
      <motion.section 
        className="bg-white py-20 px-6"
        variants={sectionVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold">Trending Destinations</h2>
            <p className="mt-2 text-gray-500">Discover opportunities in the world's fashion capitals.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {trendingLocations.map((location) => (
              <motion.div
                key={location.name}
                className="relative h-64 rounded-xl overflow-hidden group shadow-lg"
                variants={cardVariant}
                whileHover={{ scale: 1.05 }}
              >
                <img src={location.imageUrl} alt={location.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-start p-6">
                  <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    <MapPin size={20} />
                    {location.name}
                  </h3>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Testimonials Section */}
      <motion.section 
        className="bg-pink-500 text-white py-20 px-6"
        variants={sectionVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <Star className="mx-auto mb-4" size={48} />
          <h2 className="text-4xl font-bold mb-10">What Our Community Says</h2>
          <div className="space-y-8">
            {testimonials.map((testimonial, index) => (
              <blockquote key={index} className="bg-pink-600 p-6 rounded-lg shadow-inner">
                <p className="text-xl italic">"{testimonial.quote}"</p>
                <cite className="block mt-4 font-semibold not-italic">{testimonial.name}, <span className="font-normal">{testimonial.role}</span></cite>
              </blockquote>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Final CTA Section */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center bg-gray-100 p-10 rounded-xl">
          <h2 className="text-4xl font-bold">Ready to Take the Next Step?</h2>
          <p className="mt-4 text-gray-600">Join our community today and unlock a world of opportunities.</p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="mt-8 inline-block">
            <Link to="/register" className="px-10 py-4 bg-pink-600 text-white rounded-lg font-semibold shadow-lg hover:bg-pink-700 transition-all duration-300">
              Sign Up Now
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
