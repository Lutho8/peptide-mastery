import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SEOHead } from '@/components/seo/SEOHead';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Privacy Policy | Peptide South Africa"
        description="How Peptide South Africa collects, stores, and protects your peptide tracking data. Row-level security, no data sales, in-app deletion."
        canonical="https://peptide-south-africa.co.za/privacy"
      />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <article className="prose prose-neutral dark:prose-invert max-w-none">
          <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: August 2026</p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground">
              Peptide South Africa ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our peptide research and tracking application.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Information We Collect</h2>
            
            <h3 className="text-lg font-medium mb-2">Information You Provide</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1 mb-4">
              <li>Email address (when creating an account)</li>
              <li>Display name and profile information</li>
              <li>Body composition data (weight, measurements)</li>
              <li>Dose logs and protocol tracking data</li>
              <li>Stack configurations and preferences</li>
              <li>Private research-journal entries and confessions you submit</li>
              <li>Questions you choose to send to the evidence companion</li>
            </ul>

            <h3 className="text-lg font-medium mb-2">Information Collected Automatically</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Page views and navigation patterns</li>
              <li>Browser type and device information</li>
              <li>General geographic location (country/region level)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>To provide and maintain your personal tracking dashboard</li>
              <li>To sync your data securely across devices</li>
              <li>To send you important account notifications</li>
              <li>To improve our application and content based on usage patterns</li>
              <li>To answer source-grounded research questions you explicitly submit</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. Data Security & Privacy</h2>
            <p className="text-muted-foreground mb-4">
              We implement strict security measures to protect your personal data:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li><strong>Row-Level Security:</strong> Your data is completely isolated from other users</li>
              <li><strong>Encryption:</strong> All data is encrypted in transit using HTTPS</li>
              <li><strong>Secure Authentication:</strong> Industry-standard authentication protocols</li>
              <li><strong>No Data Sharing:</strong> We never sell or share your personal health data</li>
              <li><strong>AI minimisation:</strong> Our database stores the selected compound and request time for rate limiting, not the raw AI question. Calculator values are sent only when your question asks to explain that measurement.</li>
              <li><strong>Community control:</strong> Confessions remain private to you and moderators until approved. Approved posts display the alias/anonymity choice and content you submitted.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Third-Party Services</h2>
            <p className="text-muted-foreground mb-4">We use the following third-party services:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li><strong>Supabase:</strong> Secure database and authentication infrastructure</li>
              <li><strong>Evidence companion:</strong> Questions are processed inside our authenticated Supabase function from the selected source packet. Raw questions and calculator values are not sent to an external AI provider.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. Your Rights</h2>
            <p className="text-muted-foreground mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Access and export your personal data</li>
              <li>Request deletion of your account and data</li>
              <li>Update or correct your information at any time</li>
              <li>Cancel your membership subscription</li>
              <li>Object to processing of your personal data</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. Data Retention</h2>
            <p className="text-muted-foreground">
              We retain your data for as long as your account is active. If you delete your account, all associated personal data will be permanently removed within 30 days. Anonymized analytics data may be retained for statistical purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. Children's Privacy</h2>
            <p className="text-muted-foreground">
              This application is not intended for use by individuals under 18 years of age. We do not knowingly collect personal information from minors.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">9. Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify users of any material changes via email or in-app notification. The "Last updated" date at the top of this page indicates when this policy was last revised.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">10. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have questions about this Privacy Policy or our data practices, please contact us at{' '}
              <a href="mailto:privacy@peptide-south-africa.com" className="text-primary hover:underline">
                privacy@peptide-south-africa.com
              </a>
            </p>
          </section>
        </article>
      </div>
    </div>
  );
}
