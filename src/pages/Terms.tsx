/**
 * FlowLogic Terms of Service
 */

import { Link } from 'react-router-dom';
import { Brain, ArrowLeft } from 'lucide-react';

const Terms = () => {
  const lastUpdated = 'January 10, 2026';

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">FlowLogic</span>
          </Link>
          <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
        <p className="text-slate-400 mb-8">Last updated: {lastUpdated}</p>

        <div className="prose prose-invert prose-slate max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
            <p className="text-slate-300 mb-4">
              By accessing or using FlowLogic's services ("Services"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of the terms, you may not access the Service.
            </p>
            <p className="text-slate-300">
              These Terms apply to all visitors, users, and others who access or use the Service. By accessing or using the Service, you agree to be bound by these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-slate-300 mb-4">
              FlowLogic provides AI-powered warehouse management and inventory intelligence software ("Software") as a cloud-based service. The Service includes:
            </p>
            <ul className="list-disc pl-6 text-slate-300 space-y-2">
              <li>Inventory discrepancy detection and analysis</li>
              <li>Root cause analysis for inventory issues</li>
              <li>Integration with warehouse management systems (WMS)</li>
              <li>Reporting and analytics dashboards</li>
              <li>AI-powered recommendations and forecasting</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Account Registration</h2>
            <p className="text-slate-300 mb-4">
              To use certain features of the Service, you must register for an account. When you register, you agree to:
            </p>
            <ul className="list-disc pl-6 text-slate-300 space-y-2">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and promptly update your registration information</li>
              <li>Maintain the security of your password and account</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Immediately notify FlowLogic of any unauthorized use</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Subscription and Payment</h2>
            <p className="text-slate-300 mb-4">
              <strong>4.1 Free Trial:</strong> New users may be eligible for a free trial period. At the end of the trial, you will need to subscribe to a paid plan to continue using the Service.
            </p>
            <p className="text-slate-300 mb-4">
              <strong>4.2 Billing:</strong> Subscription fees are billed in advance on a monthly or annual basis. You authorize us to charge your payment method for all fees incurred.
            </p>
            <p className="text-slate-300 mb-4">
              <strong>4.3 Cancellation:</strong> You may cancel your subscription at any time. Cancellation will take effect at the end of your current billing period.
            </p>
            <p className="text-slate-300">
              <strong>4.4 Refunds:</strong> Subscription fees are non-refundable except as required by law or at FlowLogic's sole discretion.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Data and Privacy</h2>
            <p className="text-slate-300 mb-4">
              <strong>5.1 Your Data:</strong> You retain all rights to your data. You grant FlowLogic a limited license to use your data solely to provide and improve the Service.
            </p>
            <p className="text-slate-300 mb-4">
              <strong>5.2 Data Security:</strong> We implement industry-standard security measures to protect your data. However, no method of transmission over the Internet is 100% secure.
            </p>
            <p className="text-slate-300">
              <strong>5.3 Privacy Policy:</strong> Our <Link to="/privacy" className="text-blue-400 hover:text-blue-300">Privacy Policy</Link> describes how we collect, use, and share your information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Acceptable Use</h2>
            <p className="text-slate-300 mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 text-slate-300 space-y-2">
              <li>Use the Service for any illegal purpose or in violation of any laws</li>
              <li>Violate or infringe other people's intellectual property, privacy, or other rights</li>
              <li>Share your account credentials with others</li>
              <li>Attempt to gain unauthorized access to the Service or its systems</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Reverse engineer, decompile, or disassemble the Software</li>
              <li>Use the Service to transmit malware or other malicious code</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Intellectual Property</h2>
            <p className="text-slate-300 mb-4">
              The Service and its original content, features, and functionality are owned by FlowLogic and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
            <p className="text-slate-300">
              You may not copy, modify, distribute, sell, or lease any part of our Service or Software without explicit written permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Disclaimer of Warranties</h2>
            <p className="text-slate-300 mb-4">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p className="text-slate-300">
              FlowLogic does not warrant that the Service will be uninterrupted, error-free, or completely secure. Any AI-generated recommendations are for informational purposes only and should not be relied upon as the sole basis for business decisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
            <p className="text-slate-300 mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, FLOWLOGIC SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY.
            </p>
            <p className="text-slate-300">
              In no event shall FlowLogic's total liability exceed the amount you paid for the Service in the twelve (12) months preceding the claim.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Indemnification</h2>
            <p className="text-slate-300">
              You agree to indemnify and hold harmless FlowLogic and its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising out of your use of the Service or violation of these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Modifications to Service</h2>
            <p className="text-slate-300">
              FlowLogic reserves the right to modify or discontinue the Service (or any part thereof) at any time, with or without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuance of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Changes to Terms</h2>
            <p className="text-slate-300">
              We reserve the right to modify these Terms at any time. We will provide notice of material changes by posting the updated Terms on our website and updating the "Last Updated" date. Your continued use of the Service after any changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Governing Law</h2>
            <p className="text-slate-300">
              These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">14. Contact Us</h2>
            <p className="text-slate-300">
              If you have any questions about these Terms, please contact us at:
            </p>
            <p className="text-slate-300 mt-4">
              <strong>FlowLogic</strong><br />
              Email: legal@flowlogic.ai<br />
              Address: 123 Innovation Way, Suite 100, Wilmington, DE 19801
            </p>
          </section>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 py-8">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} FlowLogic. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <Link to="/privacy" className="text-slate-400 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link to="/contact" className="text-slate-400 hover:text-white transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
