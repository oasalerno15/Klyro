import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          <p className="text-sm text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                Klyro ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, 
                use, disclose, and safeguard your information when you use our financial wellness platform and related services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">2.1 Personal Information</h3>
                  <p className="text-gray-700 leading-relaxed mb-2">We may collect the following personal information:</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Name and email address</li>
                    <li>Account credentials and authentication information</li>
                    <li>Profile information and preferences</li>
                    <li>Payment and billing information (processed securely through Stripe)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">2.2 Financial Information</h3>
                  <p className="text-gray-700 leading-relaxed mb-2">With your consent, we may collect:</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Transaction data and spending patterns</li>
                    <li>Receipt information and purchase details</li>
                    <li>Financial goals and budgeting preferences</li>
                    <li>Bank account and credit card information (encrypted and securely stored)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">2.3 Emotional and Behavioral Data</h3>
                  <p className="text-gray-700 leading-relaxed mb-2">To provide our core service, we collect:</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Mood tracking data and emotional state information</li>
                    <li>Behavioral patterns and spending triggers</li>
                    <li>User-provided notes and reflections</li>
                    <li>Survey responses and feedback</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">2.4 Technical Information</h3>
                  <p className="text-gray-700 leading-relaxed mb-2">We automatically collect:</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Device information and browser type</li>
                    <li>IP address and location data</li>
                    <li>Usage patterns and feature interactions</li>
                    <li>Log files and error reports</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">We use your information to:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Provide and maintain our financial wellness services</li>
                <li>Generate personalized insights and recommendations</li>
                <li>Process payments and manage subscriptions</li>
                <li>Analyze spending patterns and emotional correlations</li>
                <li>Improve our AI algorithms and service quality</li>
                <li>Communicate with you about your account and our services</li>
                <li>Provide customer support and respond to inquiries</li>
                <li>Comply with legal obligations and prevent fraud</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Information Sharing and Disclosure</h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-blue-800 font-semibold mb-2">Our Commitment:</p>
                <p className="text-blue-700 text-sm">
                  We do not sell, trade, or rent your personal information to third parties. Your financial and emotional data 
                  is highly sensitive, and we treat it with the utmost care and security.
                </p>
              </div>

              <p className="text-gray-700 leading-relaxed mb-4">We may share your information only in the following circumstances:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>Service Providers:</strong> With trusted third-party vendors who help us operate our service (e.g., Stripe for payments, Supabase for data storage)</li>
                <li><strong>Legal Requirements:</strong> When required by law, court order, or government regulation</li>
                <li><strong>Safety and Security:</strong> To protect the rights, property, or safety of Klyro, our users, or others</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets (with user notification)</li>
                <li><strong>Consent:</strong> With your explicit consent for specific purposes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
              <p className="text-gray-700 leading-relaxed mb-4">We implement industry-standard security measures to protect your information:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>End-to-end encryption for sensitive financial data</li>
                <li>Secure HTTPS connections for all data transmission</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Access controls and authentication requirements</li>
                <li>Data backup and disaster recovery procedures</li>
                <li>Employee training on data protection and privacy</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Rights and Choices</h2>
              <p className="text-gray-700 leading-relaxed mb-4">You have the following rights regarding your personal information:</p>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">6.1 Access and Portability</h3>
                  <p className="text-gray-700 leading-relaxed">
                    You can request a copy of your personal data and export your information in a portable format.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">6.2 Correction and Updates</h3>
                  <p className="text-gray-700 leading-relaxed">
                    You can update or correct your personal information through your account settings or by contacting us.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">6.3 Deletion</h3>
                  <p className="text-gray-700 leading-relaxed">
                    You can request deletion of your account and associated data. Some information may be retained for legal or business purposes.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">6.4 Opt-Out</h3>
                  <p className="text-gray-700 leading-relaxed">
                    You can opt out of marketing communications and certain data processing activities.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Cookies and Tracking</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use cookies and similar technologies to enhance your experience and analyze usage patterns. You can control 
                cookie preferences through your browser settings.
              </p>
              <p className="text-gray-700 leading-relaxed">
                We use both session cookies (which expire when you close your browser) and persistent cookies (which remain until deleted) 
                for authentication, preferences, and analytics.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Third-Party Services</h2>
              <p className="text-gray-700 leading-relaxed mb-4">Our service integrates with third-party providers:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>Stripe:</strong> Payment processing (subject to Stripe's privacy policy)</li>
                <li><strong>Supabase:</strong> Database and authentication services</li>
                <li><strong>OpenAI:</strong> AI-powered insights and recommendations</li>
                <li><strong>Google OAuth:</strong> Authentication services (optional)</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                These services have their own privacy policies, and we encourage you to review them.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Data Retention</h2>
              <p className="text-gray-700 leading-relaxed">
                We retain your information for as long as necessary to provide our services and comply with legal obligations. 
                When you delete your account, we will delete or anonymize your personal information within 30 days, 
                except where retention is required by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. International Data Transfers</h2>
              <p className="text-gray-700 leading-relaxed">
                Your information may be transferred to and processed in countries other than your own. We ensure appropriate 
                safeguards are in place to protect your information in accordance with this privacy policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Children's Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                Our service is not intended for children under 18 years of age. We do not knowingly collect personal information 
                from children under 18. If we become aware that we have collected such information, we will take steps to delete it.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Changes to This Privacy Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by email 
                or through our service. Your continued use of the service after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700">
                  <strong>Email:</strong> privacy@klyro.app<br />
                  <strong>Address:</strong> [Your Business Address]<br />
                  <strong>Data Protection Officer:</strong> dpo@klyro.app
                </p>
              </div>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              This Privacy Policy is effective as of {new Date().toLocaleDateString()} and will remain in effect except with respect to any changes in its provisions in the future.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 