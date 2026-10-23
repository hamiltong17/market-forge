import Head from 'next/head';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <>
      <Head>
        <title>Privacy Policy · MarketForge</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
      </Head>

      <div className="privacy-container">
        <div className="app">
          {/* Brand header */}
          <div className="brand">
            <i className="fas fa-hammer"></i>
            <h1>MarketForge</h1>
            <span className="badge-ipo">PRIVACY</span>
          </div>

          {/* Privacy policy card */}
          <div className="policy-card">
            <h2><i className="fas fa-shield-halved"></i> Privacy Policy</h2>
            <div className="last-updated">
              <i className="fas fa-calendar-alt"></i> Last updated: October 22, 2026
            </div>

            {/* Intro */}
            <div className="policy-section">
              <p>
                MarketForge ("we", "our", "us") operates the MarketForge trading terminal and related services 
                (the "Platform"). This Privacy Policy explains how we collect, use, and protect your information when 
                you use our Platform. By using MarketForge, you agree to the practices described in this policy.
              </p>
            </div>

            {/* 1. Information we collect */}
            <div className="policy-section">
              <h3><i className="fas fa-database"></i> 1. Information We Collect</h3>
              <p><strong>Trading Data.</strong> We store the information you create while using the Platform, including:</p>
              <ul>
                <li><i className="fas fa-circle"></i> Simulated trades, positions, and holdings</li>
                <li><i className="fas fa-circle"></i> Paper fund balances and deposited fund balances</li>
                <li><i className="fas fa-circle"></i> Activity logs and trade history within your session</li>
              </ul>
              <p style={{ marginTop: '1rem' }}><strong>Automatically Collected Information.</strong> We may collect limited technical data such as:</p>
              <ul>
                <li><i className="fas fa-circle"></i> Browser type and version</li>
                <li><i className="fas fa-circle"></i> Device type and operating system</li>
                <li><i className="fas fa-circle"></i> IP address (in server logs, where applicable)</li>
                <li><i className="fas fa-circle"></i> Usage analytics (pages visited, features used)</li>
              </ul>
              <div className="highlight-box">
                <p><i className="fas fa-info-circle"></i> <strong>Real Funds & Paper Trading.</strong> MarketForge offers both simulated paper trading and the ability to trade with real funds. If you choose to link a real trading account or deposit real funds, our third-party payment and brokerage partners will process that information under their own privacy policies.</p>
              </div>
            </div>

            {/* 2. How we use information */}
            <div className="policy-section">
              <h3><i className="fas fa-gear"></i> 2. How We Use Your Information</h3>
              <p>We use the information collected to:</p>
              <ul>
                <li><i className="fas fa-circle"></i> Operate, maintain, and improve the trading terminal</li>
                <li><i className="fas fa-circle"></i> Display your paper funds, deposited funds, and trade history</li>
                <li><i className="fas fa-circle"></i> Process transactions and manage your account balance</li>
                <li><i className="fas fa-circle"></i> Monitor usage and prevent abuse or fraudulent activity</li>
                <li><i className="fas fa-circle"></i> Communicate important updates or changes to the Platform</li>
              </ul>
            </div>

            {/* 3. Storage & Security */}
            <div className="policy-section">
              <h3><i className="fas fa-lock"></i> 3. Data Storage & Security</h3>
              <p>
                Your trading data is stored locally in your browser session (or via secure server storage where applicable). 
                We implement reasonable technical and organizational measures to protect your information. However, no method of 
                electronic storage or transmission is 100% secure, and we cannot guarantee absolute security.
              </p>
              <p>
                <strong>Session Data:</strong> Your paper funds and holdings are maintained for the duration of your 
                session. Resetting the terminal clears this data. If you close your browser or refresh the page, your session may 
                reset depending on the configuration.
              </p>
            </div>

            {/* 4. Sharing */}
            <div className="policy-section">
              <h3><i className="fas fa-share-nodes"></i> 4. Sharing of Information</h3>
              <p>
                We do <strong>not</strong> sell, rent, or trade your personal information to third parties. We may share 
                aggregated, anonymized data for analytics or platform improvement purposes. We may also disclose information 
                if required by law or to protect the rights and safety of MarketForge, our users, or the public.
              </p>
            </div>

            {/* 5. Cookies */}
            <div className="policy-section">
              <h3><i className="fas fa-cookie-bite"></i> 5. Cookies & Similar Technologies</h3>
              <p>
                MarketForge may use cookies or local storage to remember your session state, preferences, and to analyze 
                Platform usage. You can disable cookies in your browser settings, but some features of the Platform may not 
                function properly as a result.
              </p>
            </div>

            {/* 6. Third-Party Services */}
            <div className="policy-section">
              <h3><i className="fas fa-arrow-up-right-from-square"></i> 6. Third-Party Services</h3>
              <p>
                The Platform may include links to third-party websites (e.g., Font Awesome for icons, payment processors, analytics providers). 
                We are not responsible for the privacy practices of those third parties. We encourage you to review their 
                privacy policies before providing any information.
              </p>
            </div>

            {/* 7. Children's Privacy */}
            <div className="policy-section">
              <h3><i className="fas fa-child"></i> 7. Children's Privacy</h3>
              <p>
                MarketForge is not intended for children under 13 years of age. We do not knowingly collect personal 
                information from children under 13. If you believe we have inadvertently collected such information, 
                please contact us so we can delete it.
              </p>
            </div>

            {/* 8. Your Choices */}
            <div className="policy-section">
              <h3><i className="fas fa-toggle-on"></i> 8. Your Choices</h3>
              <p>
                You may reset your paper trading account at any time using the "Reset paper" button on the terminal. 
                This clears all simulated holdings, paper funds, and activity history. If you have questions 
                about your data, you can contact us using the details below.
              </p>
            </div>

            {/* 9. Changes */}
            <div className="policy-section">
              <h3><i className="fas fa-rotate"></i> 9. Changes to This Privacy Policy</h3>
              <p>
                We may update this Privacy Policy from time to time. We will post the revised version on this page and 
                update the "Last updated" date. Your continued use of the Platform after changes become effective 
                constitutes acceptance of the updated policy.
              </p>
            </div>

            {/* 10. Contact */}
            <div className="policy-section">
              <h3><i className="fas fa-envelope"></i> 10. Contact Us</h3>
              <p>
                If you have any questions, concerns, or requests regarding this Privacy Policy or your data, please contact us at:
                <br/>
                <i className="fas fa-paper-plane" style={{ color: '#5f8aff', marginRight: '0.5rem' }}></i>
                <a href="mailto:privacy@mrktforge.com" className="contact-link">privacy@mrktforge.com</a>
              </p>
            </div>

            {/* Footer note */}
            <div className="footer-note">
              <i className="fas fa-shield-halved" style={{ marginRight: '0.4rem' }}></i>
              MarketForge is a trading environment. Ensure you understand the risks of trading with real funds.
              <br/>© 2026 MarketForge. All rights reserved.
            </div>
          </div>

          {/* Back link */}
          <Link href="/" className="back-link">
            <i className="fas fa-arrow-left"></i> Back to Terminal
          </Link>
        </div>
      </div>

      {/* Scoped Styles */}
      <style jsx global>{`
        .privacy-container {
          background: #0b0e14;
          color: #e8edf5;
          padding: 2rem 1.5rem;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .app {
          max-width: 1000px;
          width: 100%;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 2rem;
        }
        .brand i {
          color: #5f8aff;
          font-size: 2rem;
        }
        .brand h1 {
          font-weight: 600;
          font-size: 1.8rem;
          letter-spacing: -0.5px;
          background: linear-gradient(135deg, #7aa2ff, #a07aff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .badge-ipo {
          background: #1e2a3a;
          padding: 0.25rem 0.8rem;
          border-radius: 30px;
          font-size: 0.75rem;
          font-weight: 500;
          color: #b7c9e2;
          border: 1px solid #2e405b;
          letter-spacing: 0.3px;
          margin-left: 0.5rem;
        }
        .policy-card {
          background: #10161f;
          border-radius: 1.8rem;
          border: 1px solid #232e3c;
          padding: 2.5rem 2.8rem;
          box-shadow: 0 20px 35px -15px rgba(0, 0, 0, 0.8);
        }
        .policy-card h2 {
          font-size: 1.5rem;
          font-weight: 500;
          color: #d9e2f0;
          display: flex;
          align-items: center;
          gap: 0.8rem;
          margin-bottom: 0.4rem;
        }
        .policy-card h2 i {
          color: #5f8aff;
          font-size: 1.8rem;
        }
        .last-updated {
          font-size: 0.85rem;
          color: #7a8ca6;
          margin-bottom: 2rem;
          border-bottom: 1px solid #1e2836;
          padding-bottom: 1.2rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .last-updated i {
          color: #5f8aff;
        }
        .policy-section {
          margin-bottom: 2rem;
        }
        .policy-section h3 {
          font-size: 1.15rem;
          font-weight: 500;
          color: #c6d9f5;
          margin-bottom: 0.8rem;
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }
        .policy-section h3 i {
          color: #5f8aff;
          font-size: 1rem;
          width: 1.4rem;
        }
        .policy-section p {
          font-size: 0.98rem;
          line-height: 1.7;
          color: #b0c1d9;
          margin-bottom: 0.9rem;
        }
        .policy-section ul {
          list-style: none;
          padding-left: 0.5rem;
        }
        .policy-section li {
          font-size: 0.98rem;
          line-height: 1.7;
          color: #b0c1d9;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: flex-start;
          gap: 0.7rem;
        }
        .policy-section li i {
          color: #5f8aff;
          font-size: 0.85rem;
          margin-top: 0.3rem;
          width: 1rem;
          flex-shrink: 0;
        }
        .highlight-box {
          background: #0d131c;
          border-left: 4px solid #5f8aff;
          border-radius: 0 1rem 1rem 0;
          padding: 1rem 1.5rem;
          margin: 1.2rem 0;
        }
        .highlight-box p {
          margin-bottom: 0;
          font-size: 0.95rem;
          color: #c6d9f5;
        }
        .highlight-box i {
          color: #f0b34b;
          margin-right: 0.5rem;
        }
        .contact-link {
          color: #7aa2ff;
          text-decoration: none;
          font-weight: 500;
          border-bottom: 1px dashed #2e405b;
          transition: border-color 0.2s;
        }
        .contact-link:hover {
          border-bottom-color: #7aa2ff;
        }
        .footer-note {
          margin-top: 2.5rem;
          font-size: 0.8rem;
          color: #5f728b;
          text-align: center;
          border-top: 1px solid #1e2836;
          padding-top: 1.5rem;
        }
        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: #8b9bb5;
          text-decoration: none;
          font-size: 0.9rem;
          margin-top: 1.8rem;
          transition: color 0.2s;
        }
        .back-link:hover {
          color: #7aa2ff;
        }
        .back-link i {
          font-size: 0.8rem;
        }
        @media (max-width: 700px) {
          .policy-card {
            padding: 1.8rem 1.5rem;
          }
          .brand h1 {
            font-size: 1.4rem;
          }
        }
      `}</style>
    </>
  );
}