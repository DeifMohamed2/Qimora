/* ============================================================
   Contact Controller
   ============================================================ */

const Contact = require('../models/Contact');
const Subscriber = require('../models/Subscriber');
const { sendMailSafe, isSmtpConfigured, getPublicSiteUrl, getBrandedLogoEmailParts } = require('../lib/mail/mailer');
const { contactReceivedHtml, contactReceivedText } = require('../lib/mail/templates/contactReceived');

function escHtmlPlain(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// @desc    Handle contact form submission
// @route   POST /api/contact
exports.submitContact = async (req, res) => {
  try {
    const { name, email, company, message, subject, customSubject, whatsappPhone } = req.body;

    if (!subject || !String(subject).trim()) {
      return res.status(400).json({ success: false, message: 'Please select a topic.' });
    }

    const subj = String(subject).trim();
    let custom = customSubject != null ? String(customSubject).trim() : '';
    if (subj === 'other' && !custom) {
      return res.status(400).json({ success: false, message: 'Please describe your subject.' });
    }
    if (subj !== 'other') {
      custom = '';
    }

    const msg = String(message || '').trim();
    if (msg.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Please write a message (at least 10 characters).'
      });
    }

    await Contact.create({
      name: String(name || '').trim(),
      email: String(email || '').trim().toLowerCase(),
      company: company != null ? String(company).trim() : '',
      subject: subj,
      customSubject: custom,
      message: msg,
      whatsappPhone: whatsappPhone != null ? String(whatsappPhone).trim() : ''
    });

    const visitorEmail = String(email || '').trim().toLowerCase();
    const subjectLine =
      subj === 'other' && custom ? custom : subj.replace(/-/g, ' ');

    if (isSmtpConfigured() && visitorEmail) {
      const siteUrl = getPublicSiteUrl();
      const logo = getBrandedLogoEmailParts(siteUrl);
      const mailResult = await sendMailSafe({
        to: visitorEmail,
        subject: 'Your message was received — Qimora',
        html: contactReceivedHtml(
          {
            name: String(name || '').trim(),
            email: visitorEmail,
            company: company != null ? String(company).trim() : '',
            subjectLine,
            message: msg
          },
          siteUrl,
          logo.logoImgSrc
        ),
        text: contactReceivedText({
          name: String(name || '').trim(),
          subjectLine,
          company: company != null ? String(company).trim() : '',
          message: msg
        }),
        attachments: logo.attachments
      });
      if (!mailResult.sent) {
        console.error('[contact] confirmation email failed for', visitorEmail);
      }
    }

    const notifyTo = (process.env.CONTACT_INBOX_EMAIL || '').trim();
    if (isSmtpConfigured() && notifyTo) {
      const teamBody = [
        `From: ${String(name || '').trim()} <${visitorEmail}>`,
        company ? `Company: ${String(company).trim()}` : null,
        `Topic: ${subjectLine}`,
        whatsappPhone ? `WhatsApp: ${String(whatsappPhone).trim()}` : null,
        '',
        msg
      ]
        .filter(Boolean)
        .join('\n');
      await sendMailSafe({
        to: notifyTo,
        subject: `[Qimora] Contact: ${subjectLine}`,
        html: `<pre style="font-family:monospace;white-space:pre-wrap;">${escHtmlPlain(teamBody)}</pre>`,
        text: teamBody
      }).catch((e) => console.error('[contact] notify inbox:', e && e.message));
    }

    res.status(201).json({ success: true, message: "Thank you! We'll be in touch." });
  } catch (err) {
    console.error(err);
    const status = err.name === 'ValidationError' ? 400 : 500;
    res.status(status).json({ success: false, message: err.message || 'Server error' });
  }
};

// @desc    Handle email subscribe
// @route   POST /api/contact/subscribe
exports.subscribe = async (req, res) => {
  try {
    const { email } = req.body;
    await Subscriber.create({ email });
    res.status(201).json({ success: true, message: "You're on the list!" });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(200).json({ success: true, message: "You're already subscribed!" });
    }
    console.error(err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};
