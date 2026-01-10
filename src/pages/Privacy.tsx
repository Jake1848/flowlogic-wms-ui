/**
 * FlowLogic Privacy Policy
 */

import { Link } from 'react-router-dom';
import { Brain, ArrowLeft } from 'lucide-react';

const Privacy = () => {
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
        <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-slate-400 mb-8">Last updated: {lastUpdated}</p>

        <div className="prose prose-invert prose-slate max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-slate-300 mb-4">
              FlowLogic ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered warehouse intelligence platform ("Service").
            </p>
            <p className="text-slate-300">
              Please read this Privacy Policy carefully. By using the Service, you agree to the collection and use of information in accordance with this policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-medium mb-3 mt-6">2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 text-slate-300 space-y-2">
              <li><strong>Account Information:</strong> Name, email address, company name, job title, and password when you register for an account.</li>
              <li><strong>Billing Information:</strong> Payment card details, billing address, and transaction history (processed securely through our payment provider).</li>
              <li><strong>Warehouse Data:</strong> Inventory data, transaction records, and other operational data you upload or connect to our Service.</li>
              <li><strong>Communications:</strong> Messages, feedback, and support requests you send us.</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">2.2 Information Collected Automatically</h3>
            <ul className="list-disc pl-6 text-slate-300 space-y-2">
              <li><strong>Usage Data:</strong> Information about how you use our Service, including features accessed, actions taken, and time spent.</li>
              <li><strong>Device Information:</strong> Browser type, operating system, device identifiers, and IP address.</li>
              <li><strong>Cookies and Tracking:</strong> Cookies, web beacons, and similar technologies to track activity and hold certain information.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="text-slate-300 mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6 text-slate-300 space-y-2">
              <li>Provide, maintain, and improve our Service</li>
              <li>Process transactions and send related information</li>
              <li>Analyze warehouse data to generate insights and recommendations</li>
              <li>Train and improve our AI models (using aggregated, anonymized data)</li>
              <li>Send you technical notices, updates, and support messages</li>
              <li>Respond to your comments, questions, and requests</li>
              <li>Monitor and analyze trends, usage, and activities</li>
              <li>Detect, prevent, and address technical issues and fraud</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Your Warehouse Data</h2>
            <p className="text-slate-300 mb-4">
              <strong>4.1 Ownership:</strong> You retain all ownership rights to your warehouse and inventory data. We do not claim ownership of your data.
            </p>
            <p className="text-slate-300 mb-4">
              <strong>4.2 Limited Use:</strong> We use your data solely to provide and improve the Service. We will not sell, rent, or share your raw warehouse data with third parties.
            </p>
            <p className="text-slate-300 mb-4">
              <strong>4.3 AI Training:</strong> We may use aggregated, anonymized data to improve our AI models. This data cannot be traced back to your company or used to identify your specific operations.
            </p>
            <p className="text-slate-300">
              <strong>4.4 Data Retention:</strong> We retain your data for as long as your account is active or as needed to provide the Service. You may request deletion of your data at any time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Data Sharing and Disclosure</h2>
            <p className="text-slate-300 mb-4">We may share your information in the following circumstances:</p>
            <ul className="list-disc pl-6 text-slate-300 space-y-2">
              <li><strong>Service Providers:</strong> With vendors who perform services on our behalf (e.g., payment processing, hosting, analytics).</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets.</li>
              <li><strong>Legal Requirements:</strong> If required by law or in response to valid legal process.</li>
              <li><strong>Protection of Rights:</strong> To protect our rights, privacy, safety, or property.</li>
              <li><strong>With Your Consent:</strong> With your explicit consent for any other purpose.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Data Security</h2>
            <p className="text-slate-300 mb-4">
              We implement appropriate technical and organizational measures to protect your data, including:
            </p>
            <ul className="list-disc pl-6 text-slate-300 space-y-2">
              <li>Encryption of data in transit (TLS/SSL) and at rest</li>
              <li>Regular security assessments and penetration testing</li>
              <li>Access controls and authentication requirements</li>
              <li>Employee security training and confidentiality agreements</li>
              <li>Monitoring and logging of system access</li>
            </ul>
            <p className="text-slate-300 mt-4">
              However, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Your Rights and Choices</h2>
            <p className="text-slate-300 mb-4">Depending on your location, you may have the following rights:</p>
            <ul className="list-disc pl-6 text-slate-300 space-y-2">
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data.</li>
              <li><strong>Deletion:</strong> Request deletion of your personal data.</li>
              <li><strong>Portability:</strong> Request transfer of your data to another service.</li>
              <li><strong>Objection:</strong> Object to certain processing of your personal data.</li>
              <li><strong>Restriction:</strong> Request restriction of processing in certain circumstances.</li>
            </ul>
            <p className="text-slate-300 mt-4">
              To exercise these rights, please contact us at privacy@flowlogic.ai.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Cookies and Tracking Technologies</h2>
            <p className="text-slate-300 mb-4">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc pl-6 text-slate-300 space-y-2">
              <li>Keep you logged in to your account</li>
              <li>Remember your preferences</li>
              <li>Understand how you use our Service</li>
              <li>Improve our Service based on usage patterns</li>
            </ul>
            <p className="text-slate-300 mt-4">
              You can control cookies through your browser settings. However, disabling cookies may affect the functionality of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. International Data Transfers</h2>
            <p className="text-slate-300">
              Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for international transfers, including standard contractual clauses and adequacy decisions where applicable.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Children's Privacy</h2>
            <p className="text-slate-300">
              Our Service is not directed to children under 16. We do not knowingly collect personal information from children under 16. If we become aware that we have collected personal information from a child under 16, we will take steps to delete such information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. California Privacy Rights (CCPA)</h2>
            <p className="text-slate-300 mb-4">
              California residents have additional rights under the California Consumer Privacy Act (CCPA):
            </p>
            <ul className="list-disc pl-6 text-slate-300 space-y-2">
              <li>Right to know what personal information is collected</li>
              <li>Right to know whether personal information is sold or disclosed</li>
              <li>Right to opt-out of the sale of personal information</li>
              <li>Right to non-discrimination for exercising privacy rights</li>
            </ul>
            <p className="text-slate-300 mt-4">
              We do not sell personal information. To exercise your CCPA rights, contact us at privacy@flowlogic.ai.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. European Privacy Rights (GDPR)</h2>
            <p className="text-slate-300 mb-4">
              If you are in the European Economic Area (EEA), you have rights under the General Data Protection Regulation (GDPR):
            </p>
            <ul className="list-disc pl-6 text-slate-300 space-y-2">
              <li>Right of access, rectification, and erasure</li>
              <li>Right to data portability</li>
              <li>Right to object to processing</li>
              <li>Right to lodge a complaint with a supervisory authority</li>
            </ul>
            <p className="text-slate-300 mt-4">
              Our legal basis for processing personal data is typically: performance of a contract, legitimate interests, or your consent.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Changes to This Privacy Policy</h2>
            <p className="text-slate-300">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">14. Contact Us</h2>
            <p className="text-slate-300">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <p className="text-slate-300 mt-4">
              <strong>FlowLogic Privacy Team</strong><br />
              Email: privacy@flowlogic.ai<br />
              Address: 123 Innovation Way, Suite 100, Wilmington, DE 19801
            </p>
            <p className="text-slate-300 mt-4">
              For EU residents, you may also contact our Data Protection Officer at dpo@flowlogic.ai.
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
            <Link to="/terms" className="text-slate-400 hover:text-white transition-colors">
              Terms of Service
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

export default Privacy;
