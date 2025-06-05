import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionContext } from '@supabase/auth-helpers-react';
import { motion } from 'framer-motion';
import { Box, ShoppingBag, Clock, Wallet, Globe, Award, FileText, Video, Music, Image, MessageCircle, CalendarClock, Shield, Users, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HomePage() {
  const { session } = useSessionContext();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (session) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-50 to-indigo-50 pt-12 pb-24 sm:pt-16 sm:pb-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h1 
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Sell Digital Products with the 
              <span className="text-primary"> Lowest Fees</span>
            </motion.h1>
            <motion.p 
              className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              LinkNest is the marketplace where creators keep more of what they earn. 
              Sell downloads, courses, subscriptions and more with best-in-class revenue splits.
            </motion.p>
            <motion.div 
              className="mt-10 flex flex-wrap justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Button size="lg" className="py-6 px-8" onClick={handleGetStarted}>
                {session ? 'Go to Dashboard' : 'Start Selling Now'}
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Everything You Need to Sell Content
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              LinkNest gives you all the tools to build your creator business with the lowest platform fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <ShoppingBag className="h-8 w-8 text-primary" />,
                title: "Sell Any Digital Product",
                description: "From ebooks to photos, music to courses. Sell one-time purchases or subscriptions."
              },
              {
                icon: <Clock className="h-8 w-8 text-primary" />,
                title: "Setup in Minutes",
                description: "Create your LinkNest profile, connect PayPal, and start selling right away."
              },
              {
                icon: <Wallet className="h-8 w-8 text-primary" />,
                title: "Keep More Earnings",
                description: "With category-based fees as low as 5%, you earn more than on other platforms."
              },
              {
                icon: <Globe className="h-8 w-8 text-primary" />,
                title: "Global Payments",
                description: "Accept payments in USD from customers worldwide with PayPal."
              },
              {
                icon: <Box className="h-8 w-8 text-primary" />,
                title: "Customizable Storefront",
                description: "Design your profile page with your branding, layout, and style."
              },
              {
                icon: <Award className="h-8 w-8 text-primary" />,
                title: "No Monthly Fees",
                description: "Only pay when you make a sale. No subscriptions or hidden charges."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-xl shadow-sm p-8 border border-gray-100"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="text-primary mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Choose the plan that best fits your needs. No hidden fees, no surprises.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <motion.div
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold text-gray-900">Free Plan</h3>
              <p className="mt-4 text-gray-600">Perfect for testing the platform or starting a side hustle.</p>
              <div className="mt-6">
                <p className="text-5xl font-bold text-gray-900">$0<span className="text-lg text-gray-600">/mo</span></p>
                <p className="mt-2 text-gray-600">10% platform fee on sales</p>
              </div>
              <ul className="mt-8 space-y-4">
                {[
                  '5 products for sale',
                  'Up to 2 GB total storage',
                  '100 MB max video file size',
                  '20 MB max music file size',
                  '10 MB max document size',
                  'Unlimited bio links',
                  'Basic analytics (30-day view)',
                  'LinkNest branding',
                  'Email delivery only'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center">
                    <Shield className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button 
                className="w-full mt-8" 
                onClick={handleGetStarted}
              >
                Get Started Free
              </Button>
            </motion.div>

            {/* Pro Plan */}
            <motion.div
              className="bg-primary rounded-2xl shadow-lg p-8 text-white"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold">Pro Plan</h3>
              <p className="mt-4 text-white/90">Ideal for growing creators who want to scale.</p>
              <div className="mt-6">
                <p className="text-5xl font-bold">$10<span className="text-lg opacity-90">/mo</span></p>
                <p className="mt-2 opacity-90">or $100/year (save 17%)</p>
                <p className="mt-2 opacity-90">0% fee on first $500/mo</p>
                <p className="opacity-90">2% fee after $500/mo</p>
              </div>
              <ul className="mt-8 space-y-4">
                {[
                  'Unlimited products',
                  '50 GB total storage',
                  '5 GB max video file size',
                  '500 MB max music file size',
                  '200 MB max document size',
                  'Custom domain support',
                  'Advanced analytics',
                  'Priority support',
                  'Download protection'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center">
                    <Shield className="h-5 w-5 text-white mr-3" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button 
                className="w-full mt-8 bg-white text-primary hover:bg-white/90"
                onClick={handleGetStarted}
              >
                Upgrade to Pro
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Content Types Section */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Sell Any Type of Content
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              From digital downloads to coaching sessions, we support all content types with competitive fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: <FileText className="h-8 w-8" />,
                title: "Digital Products",
                fee: "10% fee",
                description: "PDFs, templates, software, and more"
              },
              {
                icon: <Video className="h-8 w-8" />,
                title: "Video Content",
                fee: "10% fee",
                description: "Courses, tutorials, and video series"
              },
              {
                icon: <Music className="h-8 w-8" />,
                title: "Audio Content",
                fee: "10% fee",
                description: "Music, podcasts, and sound effects"
              },
              {
                icon: <Image className="h-8 w-8" />,
                title: "Image Content",
                fee: "10% fee",
                description: "Photos, artwork, and design assets"
              },
              {
                icon: <MessageCircle className="h-8 w-8" />,
                title: "Coaching",
                fee: "10% fee",
                description: "1-on-1 sessions and consultations"
              },
              {
                icon: <CalendarClock className="h-8 w-8" />,
                title: "Bookings",
                fee: "10% fee",
                description: "Schedule and sell time slots"
              },
              {
                icon: <Users className="h-8 w-8" />,
                title: "Memberships",
                fee: "5% fee",
                description: "Recurring subscriptions and memberships"
              },
              {
                icon: <BookOpen className="h-8 w-8" />,
                title: "Written Content",
                fee: "5% fee",
                description: "Articles, stories, and newsletters"
              }
            ].map((type, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-xl shadow-sm p-8 border border-gray-100"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="text-primary mb-4">{type.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">{type.title}</h3>
                <p className="text-primary font-medium mb-2">{type.fee}</p>
                <p className="text-gray-600">{type.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 bg-primary">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Ready to Start Selling?
            </h2>
            <p className="mt-4 text-xl text-white/90">
              Join thousands of creators already using LinkNest to sell digital content worldwide.
            </p>
            <div className="mt-10">
              <Button 
                size="lg" 
                variant="accent" 
                className="py-6 px-8 bg-white text-primary hover:bg-white/90"
                onClick={handleGetStarted}
              >
                {session ? 'Go to Dashboard' : 'Create Your Profile Now'}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}