"use client";
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, MapPin, MessageSquare } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-24">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-[#1678fb] transition-colors font-semibold text-sm">
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900 leading-tight">
          We're here to help.
        </h1>
        <p className="text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Whether you have a tax query, need help navigating our portal, or want to explore enterprise solutions, our team is just a message away.
        </p>
      </section>

      {/* Layout Grid */}
      <section className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          
          {/* Left: Contact Info */}
          <div className="p-12 bg-[#1e2a3b] text-white flex flex-col justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-8">Contact Information</h2>
              <div className="space-y-8 text-slate-300">
                <div className="flex items-start gap-4">
                  <Mail className="text-[#1678fb] shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-white mb-1">Email Us</h4>
                    <p className="text-sm">support@nextax.in</p>
                    <p className="text-sm">enterprise@nextax.in</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <Phone className="text-[#1678fb] shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-white mb-1">Call Us</h4>
                    <p className="text-sm">1800-123-4567 (Toll Free)</p>
                    <p className="text-sm">Mon-Fri from 9am to 6pm IST</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <MapPin className="text-[#1678fb] shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-white mb-1">Office HQ</h4>
                    <p className="text-sm leading-relaxed">
                      NexTax Software Pvt. Ltd.<br/>
                      Ground Floor, Cyber Hub, Sector 1<br/>
                      New Delhi - 110001, India
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Contact Form */}
          <div className="p-12">
            <h3 className="text-2xl font-bold mb-6 text-slate-800">Send us a message</h3>
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                <input type="text" className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-[#1678fb] focus:ring-1 focus:ring-[#1678fb] outline-none transition-all" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                <input type="email" className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-[#1678fb] focus:ring-1 focus:ring-[#1678fb] outline-none transition-all" placeholder="john@example.com" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">How can we help?</label>
                <textarea rows={4} className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-[#1678fb] focus:ring-1 focus:ring-[#1678fb] outline-none transition-all" placeholder="Tell us more about your query..."></textarea>
              </div>
              <button type="submit" className="w-full bg-[#1678fb] text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-blue-600 transition-colors flex items-center justify-center gap-2">
                <MessageSquare size={18} /> Send Message
              </button>
            </form>
          </div>

        </div>
      </section>
    </div>
  );
}
