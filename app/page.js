"use client"

import React, { useState, useRef, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Lock, Users, BarChart2, Search, FileText, Briefcase, Zap, Globe, MessageSquare, Shield, Clock, Phone, Mail, Twitter, Linkedin, Github } from 'lucide-react';

// --- Global Constants ---
const APP_NAME = "Travest";
const COMPANY_SLOGAN = "The Future of Seed Investment, Simplified.";

// --- Reusable Components ---

/**
 * Animated Gradient & Particle Background for the Hero Section
 */
const AnimatedBackground = () => (
    <div className="absolute inset-0 overflow-hidden z-0">
        {/* Soft Neon Gradient Layer 1 (Indigo-Pink) */}
        <motion.div
            className="absolute top-[-30vh] left-[-30vw] w-[100vw] h-[100vh] rounded-full mix-blend-color-dodge opacity-50 blur-3xl bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900"
            animate={{ scale: [1, 1.1, 1], rotate: [0, 10, 0] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        />
        {/* Soft Neon Gradient Layer 2 (Cyan-Violet) */}
        <motion.div
            className="absolute bottom-[-40vh] right-[-40vw] w-[120vw] h-[120vh] rounded-full mix-blend-color-dodge opacity-50 blur-3xl bg-gradient-to-tl from-cyan-900 via-violet-900 to-fuchsia-900"
            animate={{ scale: [1, 1.2, 1], rotate: [0, -10, 0] }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        />

        {/* Minimalist Floating Particles */}
        {[...Array(10)].map((_, i) => (
            <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-white opacity-10"
                style={{
                    top: `${Math.random() * 100}vh`,
                    left: `${Math.random() * 100}vw`,
                }}
                // Add this prop to tell React to ignore the style mismatch
                suppressHydrationWarning={true}
                animate={{
                    y: [0, Math.random() * 100 - 50, 0],
                    x: [0, Math.random() * 100 - 50, 0],
                    opacity: [0.1, 0.4, 0.1],
                    scale: [1, 1.5, 1],
                }}
                transition={{
                    duration: Math.random() * 20 + 20,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: Math.random() * 5,
                }}
            />
        ))}
    </div>
);

/**
 * Reusable Section Header Component with professional animation.
 */
const SectionHeader = ({ title, subtitle, align = 'center' }) => {
    const isCenter = align === 'center';
    const alignClass = isCenter ? 'text-center max-w-3xl mx-auto' : 'text-left max-w-2xl';

    const headerVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, staggerChildren: 0.2 } },
    };

    const textVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    return (
        <motion.div
            className={`mb-12 md:mb-16 ${alignClass}`}
            variants={headerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
        >
            <motion.h3 variants={textVariants} className="text-sm font-semibold uppercase tracking-widest text-indigo-400 mb-2">
                {subtitle}
            </motion.h3>
            <motion.h2 variants={textVariants} className="text-4xl sm:text-5xl font-extrabold text-white leading-tight">
                {title}
            </motion.h2>
        </motion.div>
    );
};

/**
 * Reusable Feature Card Component with Framer Motion hover effects and Glassmorphism.
 */
const FeatureCard = ({ icon: Icon, title, description }) => {
    const iconVariants = {
        rest: { rotate: 0, scale: 1 },
        hover: { rotate: 5, scale: 1.1, transition: { type: "spring", stiffness: 400, damping: 10 } }
    };

    return (
        <motion.div
            className="p-6 md:p-8 rounded-2xl border border-gray-700/50 backdrop-blur-lg bg-gray-800/50 shadow-2xl transition-all duration-300 cursor-pointer"
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.5 } }}
            whileHover="hover"
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.3 }}
        >
            <motion.div
                variants={iconVariants}
                className="w-12 h-12 p-3 mb-4 rounded-xl bg-indigo-600/70 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30"
            >
                <Icon size={24} strokeWidth={2.5} />
            </motion.div>
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-gray-400 text-base">{description}</p>
        </motion.div>
    );
};

/**
 * Reusable Trust Point Component.
 */
const TrustPoint = ({ icon: Icon, title, description }) => (
    <motion.div
        className="flex items-start space-x-4 p-4 rounded-xl border border-transparent hover:border-indigo-500/50 transition duration-300"
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.5 }}
    >
        <div className="flex-shrink-0 mt-1">
            <Icon className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
            <h4 className="text-lg font-semibold text-white">{title}</h4>
            <p className="text-gray-400">{description}</p>
        </div>
    </motion.div>
);

import { Menu, X } from 'lucide-react';

const Nav = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navLinks = [
        'Features',
        'For Founders',
        'For Investors',
        'Pricing',
        'Blog',
    ];

    return (
        <>
            {/* Desktop + Mobile Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50  backdrop-blur-2xl  border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">

                        {/* Logo */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                            className="flex-shrink-0"
                        >
                            <Link href="/" className="text-4xl font-black tracking-tighter bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent hover:from-cyan-300 hover:to-pink-300 transition-all">
                                Travest
                            </Link>
                        </motion.div>

                        {/* Desktop Navigation */}
                        <div className="hidden lg:flex items-center gap-10">
                            {navLinks.map((link) => (
                                <Link
                                    key={link}
                                    href="#"
                                    className="relative text-gray-300 hover:text-white font-medium text-lg transition-colors duration-300 after:content-[''] after:absolute after:bottom-[-8px] after:left-0 after:w-0 after:h-0.5 after:bg-gradient-to-r after:from-cyan-400 after:to-purple-400 after:transition-all after:duration-300 hover:after:w-full"
                                >
                                    {link}
                                </Link>
                            ))}

                            {/* Sign In Button */}
                            <Link
                                href="login"
                                className="ml-8 px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full font-bold text-white shadow-lg shadow-purple-500/30 hover:shadow-cyan-500/50 hover:scale-105 transition-all duration-300"
                            >
                                Sign In
                            </Link>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition"
                        >
                            {mobileMenuOpen ? (
                                <X className="w-8 h-8 text-white" />
                            ) : (
                                <Menu className="w-8 h-8 text-white" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu - Full Screen Overlay */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: mobileMenuOpen ? 1 : 0, y: mobileMenuOpen ? 0 : -20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className={`lg:hidden fixed inset-x-0 top-20 bg-black/95 backdrop-blur-3xl border-t border-white/10 ${mobileMenuOpen ? 'block' : 'hidden'
                        }`}
                    style={{ pointerEvents: mobileMenuOpen ? 'auto' : 'none' }}
                >
                    <div className="px-6 py-8 space-y-6">
                        {navLinks.map((link) => (
                            <Link
                                key={link}
                                href="#"
                                onClick={() => setMobileMenuOpen(false)}
                                className="block text-2xl font-medium text-gray-300 hover:text-cyan-400 transition py-3 border-b border-white/5 last:border-0"
                            >
                                {link}
                            </Link>
                        ))}
                        <Link
                            href="login"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block mt-10 px-12 py-5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full font-bold text-xl text-center shadow-xl hover:scale-105 transition-all"
                        >
                            Sign In
                        </Link>
                    </div>
                </motion.div>
            </nav>

            {/* Spacer to prevent content from hiding under fixed navbar */}
            <div className="h-20" />
        </>
    );
}

const HeroSection = () => {
    const targetRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ["start start", "end start"],
    });

    // Parallax effect: image moves up slower than the foreground content
    const yImage = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);

    return (
        <section ref={targetRef} className="relative h-[100vh] flex items-center justify-center pb-12 overflow-hidden bg-gray-950/90 text-center">
            <AnimatedBackground />

            {/* AI-Generated Background Placeholder */}
            <motion.div style={{ y: yImage }} className="absolute inset-0 z-10 opacity-10">
                <img
                    src="https://placehold.co/1920x1080/0e172a/9ca3af?text=Futuristic+Tech+Pattern+(AI)"
                    alt="Abstract futuristic geometric pattern background"
                    className="w-full h-full object-cover"
                    loading="lazy"
                />
            </motion.div>

            <div className="relative z-20 max-w-4xl px-4">
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                >
                    <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-white leading-tight mb-6">
                        Empowering <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Startups. Connecting</span> Investors.
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto">
                        {COMPANY_SLOGAN} Stop wading through noise. Travest connects serious founders with vetted investors on a platform built for security and scale.
                    </p>

                    <div className="flex justify-center space-x-4">
                        <motion.button
                            className="flex items-center space-x-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold text-lg hover:bg-indigo-500 transition duration-300 shadow-xl shadow-indigo-600/50"
                            whileHover={{ scale: 1.05, rotate: "0.5deg", boxShadow: "0 10px 20px rgba(99, 102, 241, 0.6)" }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <span>Launch Your Profile</span>
                            <ArrowRight className="w-5 h-5" />
                        </motion.button>
                        <motion.button
                            className="flex items-center space-x-2 px-8 py-3 border border-gray-600 text-gray-300 rounded-xl font-semibold text-lg hover:border-cyan-400 hover:text-cyan-400 transition duration-300"
                            whileHover={{ scale: 1.05, rotate: "-0.5deg" }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <span>Explore Features</span>
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

const AboutSection = () => (
    <motion.section
        id="about"
        className="py-24 md:py-32 bg-gray-900 border-t border-gray-800"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7 }}
    >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader
                title="Building the Trusted Bridge Between Capital and Innovation"
                subtitle="Our Mission"
            />
            <div className="mt-16 grid lg:grid-cols-2 gap-12 items-center">
                {/* Image Placeholder */}
                <motion.div
                    className="relative rounded-2xl overflow-hidden shadow-2xl shadow-indigo-900/50"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.8 }}
                >
                    <img
                        src="https://placehold.co/800x600/1e293b/a8a29e?text=Productivity+Illustration+(Innovation)"
                        alt="Illustration of global networking and data analytics"
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 to-transparent"></div>
                </motion.div>

                <div className="text-gray-300 space-y-6">
                    <p className="text-lg font-semibold text-white">
                        At {APP_NAME}, we believe great ideas deserve great funding. The current early-stage investment landscape is fractured, inefficient, and often lacks transparency. We solved this.
                    </p>
                    <p>
                        Our platform is engineered for mutual confidence. By rigorously verifying every founder and investor profile, and integrating advanced matching algorithms, we eliminate friction and accelerate meaningful connections. This foundation of trust is not optional—it's the core of our technology.
                    </p>
                    <p>
                        We don't just facilitate transactions; we cultivate long-term partnerships. Our commitment to data security (S3 file encryption) and compliance ensures your journey, from pitch deck to term sheet, is protected, professional, and scalable.
                    </p>
                    <Link href="#features" className="inline-flex items-center text-indigo-400 font-medium group hover:text-cyan-400 transition duration-300 mt-4">
                        Discover the Travest advantage
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        </div>
    </motion.section>
);

const FeaturesSection = () => {
    const features = [
        { icon: Lock, title: "End-to-End Secure Sign-Up", description: "Utilizing multi-factor authentication and encrypted protocols to ensure your data and identity are protected from the first click." },
        { icon: Users, title: "Precision Investor–Founder Matching", description: "Our proprietary AI algorithm analyzes sector, stage, and thesis to deliver ideal, mutually beneficial partnership recommendations." },
        { icon: CheckCircle, title: "100% Verified Profiles", description: "Every user undergoes a comprehensive verification process, ensuring you only connect with serious, accredited investors and legitimate founders." },
        { icon: BarChart2, title: "Integrated Analytics Dashboard", description: "Track engagement, view investor interest metrics, and monitor your pitch performance in real-time with comprehensive data visualizations." },
        { icon: Search, title: "Smart Intent-Based Search", description: "Move beyond keywords. Find exactly what you need with search queries based on funding stage, geographical focus, or technology stack." },
        { icon: FileText, title: "Encrypted Cloud File Uploads (S3)", description: "Securely share sensitive documents, pitch decks, and financial models using Amazon S3-backed, end-to-end encrypted storage." },
    ];

    return (
        <section id="features" className="py-24 md:py-32 bg-gray-950">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <SectionHeader
                    title="The Integrated Platform for Serious Capital"
                    subtitle="Core Features"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
                    {features.map((feature, index) => (
                        <FeatureCard key={index} {...feature} />
                    ))}
                </div>
            </div>
        </section>
    );
};

const TrustSection = () => {
    const trustPoints = [
        { icon: Shield, title: "Tier-1 Security Standards", description: "CCPA/GDPR compliant data handling and continuous penetration testing to protect your private information." },
        { icon: Clock, title: "24/7 Dedicated Support", description: "Access to our team of financial tech specialists whenever you need guidance, ensuring zero downtime for crucial connections." },
        { icon: Globe, title: "Global Network Reach", description: "Connect with investors and founders from key tech hubs across the globe, expanding your opportunities exponentially." },
        { icon: Briefcase, title: "Streamlined Legal Workflows", description: "Integrated tools and templates to accelerate the due diligence and legal documentation process, saving time and costs." },
    ];

    return (
        <section id="trust" className="py-24 md:py-32 bg-gray-900 border-t border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <SectionHeader
                        title="Why Elite Founders and Investors Choose Travest"
                        subtitle="Commitment to Excellence"
                        align="left"
                    />
                    <div className="lg:hidden h-64 relative rounded-xl overflow-hidden shadow-2xl shadow-cyan-900/50">
                        <img
                            src="https://placehold.co/800x400/1e293b/a8a29e?text=Security+Illustration+(Trust)"
                            alt="Illustration of data security and trust"
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                    </div>
                    <div className="space-y-8">
                        {trustPoints.map((point, index) => (
                            <TrustPoint key={index} {...point} />
                        ))}
                    </div>
                    <div className="hidden lg:block relative rounded-2xl overflow-hidden shadow-2xl shadow-cyan-900/50">
                        <img
                            src="https://placehold.co/800x600/1e293b/a8a29e?text=Security+Illustration+(Trust)"
                            alt="Illustration of data security and trust"
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

const TestimonialsSection = () => {
    const testimonials = [
        { name: "Alex B.", title: "Venture Partner, Alpha Capital", quote: "Travest transformed our sourcing strategy. The quality and verification of founders are unmatched. This is the future of seed investing." },
        { name: "Sarah K.", title: "Founder, Zenith Labs", quote: "Securing our Series A was fast and efficient. The matching system paired us perfectly with investors aligned with our deep-tech mission." },
        { name: "John D.", title: "Angel Investor", quote: "The analytics dashboard gives me unprecedented insight into founder engagement. High signal, low noise—a game-changer." },
    ];

    return (
        <section id="testimonials" className="py-24 md:py-32 bg-gray-950">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <SectionHeader
                    title="Trusted by Top-Tier Investors and Ambitious Founders"
                    subtitle="Testimonials"
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
                    {testimonials.map((t, index) => (
                        <motion.div
                            key={index}
                            className="p-8 rounded-2xl bg-gray-800 border-t-4 border-indigo-600 shadow-xl"
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(99, 102, 241, 0.3)" }}
                            viewport={{ once: true, amount: 0.5 }}
                            transition={{ type: "spring", stiffness: 100 }}
                        >
                            <MessageSquare className="w-8 h-8 text-indigo-400 mb-4" />
                            <p className="italic text-lg text-gray-200 mb-6">"{t.quote}"</p>
                            <div className="font-semibold text-white">{t.name}</div>
                            <div className="text-sm text-indigo-400">{t.title}</div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const FAQSection = () => {
    const faqs = [
        { q: "Is Travest only for US-based companies?", a: "No, Travest is built for global reach. Our platform connects founders and investors across all major international tech hubs, with robust support for multi-currency transactions." },
        { q: "How does the profile verification process work?", a: "Our verification process involves a combination of automated checks (e.g., entity registration) and manual review by our compliance team to ensure every profile is legitimate and professional." },
        { q: "What security measures are in place for my pitch deck?", a: "All sensitive files uploaded via our platform are immediately encrypted and stored on Amazon S3 with access controls enforced by strict user permissions and end-to-end encryption protocols." },
        { q: "How do I get started?", a: "Simply click 'Start Free Trial' to launch your profile. Our onboarding process is designed to quickly guide you through setting up your profile and getting matched with relevant parties." },
    ];

    return (
        <section id="faq" className="py-24 md:py-32 bg-gray-950 border-t border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <SectionHeader
                    title="Frequently Asked Questions"
                    subtitle="Clarity & Support"
                />

                <div className="mt-16 max-w-4xl mx-auto space-y-6">
                    {faqs.map((faq, index) => (
                        <motion.div
                            key={index}
                            className="p-6 rounded-xl bg-gray-800/50 border border-gray-700/50"
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, amount: 0.5 }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                        >
                            <h4 className="text-lg font-semibold text-white mb-2 flex items-center">
                                <Zap className="w-5 h-5 text-indigo-400 mr-3" />
                                {faq.q}
                            </h4>
                            <p className="text-gray-400 ml-8">{faq.a}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const Footer = () => (
    <footer className="py-12 md:py-16 bg-gray-900 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-8 border-b border-gray-700 pb-10 mb-10">
                <div className="col-span-2 md:col-span-1">
                    <div className="text-2xl font-extrabold text-white tracking-wider mb-4">
                        {APP_NAME}<span className="text-indigo-400">.</span>
                    </div>
                    <p className="text-gray-400 text-sm">
                        {COMPANY_SLOGAN}
                    </p>
                </div>

                <div>
                    <h5 className="font-bold text-white mb-4">Product</h5>
                    <ul className="space-y-3 text-sm">
                        {['Features', 'Verification', 'Security', 'FAQ'].map((item) => (
                            <li key={item}><Link href={`#${item.toLowerCase()}`} className="text-gray-400 hover:text-indigo-400 transition">{item}</Link></li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h5 className="font-bold text-white mb-4">Company</h5>
                    <ul className="space-y-3 text-sm">
                        {['About Us', 'Mission', 'Testimonials', 'Careers'].map((item) => (
                            <li key={item}><Link href={`#${item.toLowerCase()}`} className="text-gray-400 hover:text-indigo-400 transition">{item}</Link></li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h5 className="font-bold text-white mb-4">Support</h5>
                    <ul className="space-y-3 text-sm">
                        {['Help Center', 'API Status', 'Contact Sales'].map((item) => (
                            <li key={item}><Link href={`#${item.toLowerCase()}`} className="text-gray-400 hover:text-indigo-400 transition">{item}</Link></li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h5 className="font-bold text-white mb-4">Legal</h5>
                    <ul className="space-y-3 text-sm">
                        {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((item) => (
                            <li key={item}><Link href={`#${item.toLowerCase()}`} className="text-gray-400 hover:text-indigo-400 transition">{item}</Link></li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center">
                <p className="text-sm text-gray-500 mb-4 md:mb-0">
                    &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved. Built with Trust and Code.
                </p>
                <div className="flex space-x-6">
                    {[Twitter, Linkedin, Github].map((Icon, index) => (
                        <motion.a
                            key={index}
                            href="#"
                            className="text-gray-400 hover:text-indigo-400 transition"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                        >
                            <Icon className="w-6 h-6" />
                        </motion.a>
                    ))}
                </div>
            </div>
        </div>
    </footer>
);


export default function App() {
    // Basic SEO Setup (In a real Next.js app, this would be in the <Head> component)
    useEffect(() => {
        document.title = `${APP_NAME} - ${COMPANY_SLOGAN}`;
    }, []);

    // Set font to Inter (Tailwind default is inter) and apply dark background for the whole page
    return (
        <div className="min-h-screen bg-gray-950 text-white antialiased">
            {/* Navigation Bar */}
            <Nav />

            <main className="">
                {/* 1. Hero Section: Cinematic Motion, Gradient/Particle Background, Parallax */}
                <HeroSection />

                {/* 2. About / Mission Section */}
                <AboutSection />

                {/* 3. Features Section (Min 6 Features, Reusable FeatureCard) */}
                <FeaturesSection />

                {/* 4. Why Choose Us (Trust-building bullets) */}
                <TrustSection />

                {/* 5. Testimonials (Placeholder Content) */}
                <TestimonialsSection />

                {/* 6. FAQ Section */}
                <FAQSection />
            </main>

            {/* 7. Footer */}
            <Footer />
        </div>
    );
}