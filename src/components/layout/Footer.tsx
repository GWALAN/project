import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Twitter, Instagram, Github } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="mb-8 md:mb-0">
            <Link to="/" className="flex items-center space-x-2">
              <Box className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-primary">LinkNest</span>
            </Link>
            <p className="mt-4 text-sm text-gray-600 max-w-md">
              The global creator marketplace where you can sell digital content directly 
              to your audience with the most competitive platform fees.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
                Product
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/" className="text-sm text-gray-600 hover:text-primary">
                    Features
                  </Link>
                </li>
                <li>
                  <Link to="/" className="text-sm text-gray-600 hover:text-primary">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link to="/" className="text-sm text-gray-600 hover:text-primary">
                    Creator Resources
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
                Company
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/" className="text-sm text-gray-600 hover:text-primary">
                    About
                  </Link>
                </li>
                <li>
                  <Link to="/" className="text-sm text-gray-600 hover:text-primary">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link to="/" className="text-sm text-gray-600 hover:text-primary">
                    Careers
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
                Legal
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/" className="text-sm text-gray-600 hover:text-primary">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link to="/" className="text-sm text-gray-600 hover:text-primary">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link to="/" className="text-sm text-gray-600 hover:text-primary">
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} LinkNest. All rights reserved.
          </p>
          
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-primary">
              <Twitter className="h-5 w-5" />
            </a>
            <a href="#" className="text-gray-400 hover:text-primary">
              <Instagram className="h-5 w-5" />
            </a>
            <a href="#" className="text-gray-400 hover:text-primary">
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}