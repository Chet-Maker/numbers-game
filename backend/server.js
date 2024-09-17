const express = require('express');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');
const PDFDocument = require('pdfkit');
const sanitize = require('sanitize-filename');
require('dotenv').config();
const { spawn } = require('child_process'); 

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('Error: OpenAI API key is not set.');
  process.exit(1);
}

app.post('/generate/resume', async (req, res) => {
  const {
    experiences,
    technicalSkills,
    education,
    createResume,
    companyApplyingTo,
    isTechnicalRole,
    companyRoleDescription,
    createCoverLetter,
  } = req.body;

  // Prepare the messages for ChatGPT
  let messages = [
    {
      role: 'system',
      content: 'You are an expert resume and cover letter writer.',
    },
    {
      role: 'user',
      content: `
My background:
Experiences: ${experiences}
Technical Skills: ${technicalSkills}
Education: ${education}
Company Applying To: ${companyApplyingTo}
Type of Role: ${isTechnicalRole ? 'Technical' : 'Non-Technical'}
Company Role Description: ${companyRoleDescription}
`,
    },
  ];

  if (createResume) {
    messages.push({
      role: 'user',
      content: 'Please create a resume tailored to the job description.',
    });
  }

  if (createCoverLetter) {
    messages.push({
      role: 'user',
      content: 'Please create a cover letter tailored to the job description.',
    });
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo-0125',
        messages: messages,
        max_tokens: 2000,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    const assistantResponse = response.data.choices[0].message.content;

    // Parse the assistant's response (assuming resume and cover letter are separated by '---')
    const [resumeContent, coverLetterContent] = assistantResponse.split('---');

    // Construct the path to the Desktop
    const desktopDir = path.join(os.homedir(), 'Desktop');

    // Sanitize and prepare directory and file paths
    const companyRoleName = sanitize(companyApplyingTo.replace(/\s+/g, '_'));
    const saveDir = path.join(desktopDir, 'Resume', companyRoleName);
    fs.mkdirSync(saveDir, { recursive: true });

    const resumePDFPath = path.join(saveDir, 'Chet_Backiewicz_Resume.pdf');
    const coverLetterPDFPath = path.join(saveDir, 'Chet_Backiewicz_Cover_Letter.pdf');

    // Generate PDFs
    if (createResume && resumeContent) {
      const doc = new PDFDocument();
      doc.pipe(fs.createWriteStream(resumePDFPath));
      doc.text(resumeContent);
      doc.end();
    }

    if (createCoverLetter && coverLetterContent) {
      const doc = new PDFDocument();
      doc.pipe(fs.createWriteStream(coverLetterPDFPath));
      doc.text(coverLetterContent);
      doc.end();
    }

    // Send success response
    res.json({ message: 'Documents generated and saved successfully.' });
  } catch (error) {
    console.error('Error generating documents:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error generating documents' });
  }
});

// NEW /generate/coverletter endpoint
app.post('/generate/coverletter', async (req, res) => {
    const {
      applicantName,
      applicantEmail,
      applicantLinkedIn,
      applicantPhone,
      applicantLocation,
      recipientName,
      closer,
      applicantTitle,
      experiences,
      education,
      certifications,
      technicalSkills,
      companyApplyingTo,
      jobTitleApplyingTo,
      companyRoleDescription,
    } = req.body;
  
    // Validate that the essential fields are present
    if (!applicantName || !applicantEmail || !experiences || !companyApplyingTo || !jobTitleApplyingTo || !companyRoleDescription) {
      return res.status(400).json({ error: 'Missing required fields.' + JSON.stringify(req.body) });
    }
  
    try {
      // Prepare the message for the AI model
      const experienceDescriptions = experiences.map((exp) => `
        ${exp.jobTitle}, ${exp.companyName}:
        Start Date: ${exp.startDate}, End Date: ${exp.endDate}
        Responsibilities:
        ${exp.responsibilities.map((res) => `- ${res}`).join('\n')}
      `).join('\n');
  
      const educationDescriptions = education.map((edu) => `
        - ${edu.degree} from ${edu.institution} (${edu.startDate} - ${edu.endDate})
      `).join('\n');
  
      const certificationsList = certifications.map((cert) => `- ${cert}`).join('\n');
  
      const aiPrompt = `
        I am applying for the position of ${jobTitleApplyingTo} at ${companyApplyingTo}.
        The role description is as follows: ${companyRoleDescription}
  
        Using my background and experiences, please write the body of a cover letter tailored to this role.
        Again, only write what will be between the greeting and the closing, as I will provide the rest.
        Highlight my most relevant skills, experiences, and qualifications that match the job description.
        Also, ensure that the cover letter is only four paragraphs long, and ensure that it is tailored to the company and role.
        Please make sure to only include the body of the of the cover letter, as plaintext, as I will input it into a predefined template.

  
        My experiences include:
        ${experienceDescriptions}
  
        My education includes:
        ${educationDescriptions}
  
        My certifications include:
        ${certificationsList}
  
        My technical skills include:
        ${technicalSkills}
  
        Please provide the cover letter in plain text.
      `;
  
      // Call the OpenAI API
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are an expert cover letter writer.' },
            { role: 'user', content: aiPrompt },
          ],
          max_tokens: 1500,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
        }
      );
  
      const assistantResponse = response.data.choices[0].message.content;
  
      // Convert the assistant's response into a PDF
      const coverLetterBody = assistantResponse.trim();
      const sanitizedCoverLetterBody = sanitizeLaTeXInput(coverLetterBody);
  
      // Prepare LaTeX content
      const latexTemplate = fs.readFileSync(path.join(__dirname, 'cover_letter_template.tex'), 'utf-8');
      const latexContent = latexTemplate
        .replace(/%APPLICANT_NAME%/g, applicantName)
        .replace(/%APPLICANT_EMAIL%/g, applicantEmail)
        .replace(/%APPLICANT_LINKEDIN%/g, applicantLinkedIn)
        .replace(/%APPLICANT_PHONE%/g, applicantPhone)
        .replace(/%APPLICANT_LOCATION%/g, applicantLocation)
        .replace(/%RECIPIENT_NAME%/g, recipientName)
        .replace(/%COVER_LETTER_BODY%/g, sanitizedCoverLetterBody)
        .replace(/%CLOSER%/g, closer)
        .replace(/%APPLICANT_TITLE%/g, applicantTitle);
  
      const outputDir = path.join(__dirname, 'generated');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
      }
  
      const texFilePath = path.join(outputDir, 'cover_letter.tex');
      fs.writeFileSync(texFilePath, latexContent);
  
      // Compile LaTeX to PDF
      compileLatex(texFilePath, (pdfFilePath) => {
        const pdfData = fs.readFileSync(pdfFilePath);
        res.set('Content-Type', 'application/pdf');
        res.send(pdfData);
      });
  
    } catch (error) {
      console.error('Error generating cover letter:', error.response?.data || error.message);
      res.status(500).json({ error: 'Error generating cover letter' });
    }
  });
  
  function compileLatex(texFilePath, callback) {
    const outputDir = path.dirname(texFilePath);
    const pdflatex = spawn('pdflatex', ['-interaction=nonstopmode', '-output-directory', outputDir, texFilePath]);
  
    let output = '';
  
    // Capture stdout and stderr
    pdflatex.stdout.on('data', (data) => {
      output += data.toString();
    });
  
    pdflatex.stderr.on('data', (data) => {
      output += data.toString();
    });
  
    pdflatex.on('exit', (code) => {
      if (code === 0) {
        const pdfFilePath = path.join(outputDir, 'cover_letter.pdf');
        callback(pdfFilePath);
      } else {
        console.error('pdflatex failed with exit code', code);
        console.error('LaTeX Output:', output);
        const logFilePath = path.join(outputDir, 'cover_letter.log');
        fs.writeFileSync(logFilePath, output);
        console.error(`LaTeX log saved to: ${logFilePath}`);
      }
    });
  }

  function sanitizeLaTeXInput(input) {
    return input
      .replace(/&/g, '\\&')
      .replace(/%/g, '\\%')
      .replace(/\$/g, '\\$')
      .replace(/#/g, '\\#')
      .replace(/_/g, '\\_')
      .replace(/{/g, '\\{')
      .replace(/}/g, '\\}')
      .replace(/\^/g, '\\^{}')
      .replace(/~/g, '\\~{}');
  }

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});