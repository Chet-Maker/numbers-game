import React, { useState } from 'react';
import axios from 'axios';
import './App.css'; // Ensure you have appropriate styling

function App() {
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [applicantLinkedIn, setApplicantLinkedIn] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [applicantLocation, setApplicantLocation] = useState('');
  const [greeting, setGreeting] = useState('Dear');
  const [closer, setCloser] = useState('Sincerely');
  const [applicantTitle, setApplicantTitle] = useState('');

  const [experiences, setExperiences] = useState([]);
  const [education, setEducation] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [technicalSkills, setTechnicalSkills] = useState('');
  const [companyApplyingTo, setCompanyApplyingTo] = useState('');
  const [jobTitleApplyingTo, setJobTitleApplyingTo] = useState('');
  const [isTechnicalRole, setIsTechnicalRole] = useState(true);
  const [companyRoleDescription, setCompanyRoleDescription] = useState('');

  // Experience handlers
  const addExperience = () => {
    setExperiences([...experiences, { companyName: '', jobTitle: '', startDate: '', endDate: '', responsibilities: [''] }]);
  };

  const updateExperience = (index, field, value) => {
    const newExperiences = [...experiences];
    newExperiences[index][field] = value;
    setExperiences(newExperiences);
  };

  const addResponsibility = (expIndex) => {
    const newExperiences = [...experiences];
    newExperiences[expIndex].responsibilities.push('');
    setExperiences(newExperiences);
  };

  const updateResponsibility = (expIndex, resIndex, value) => {
    const newExperiences = [...experiences];
    newExperiences[expIndex].responsibilities[resIndex] = value;
    setExperiences(newExperiences);
  };

  // Education handlers
  const addEducationEntry = () => {
    setEducation([...education, { institution: '', degree: '', startDate: '', endDate: '' }]);
  };

  const updateEducation = (index, field, value) => {
    const newEducation = [...education];
    newEducation[index][field] = value;
    setEducation(newEducation);
  };

  // Certification handlers
  const addCertification = () => {
    setCertifications([...certifications, '']);
  };

  const updateCertification = (index, value) => {
    const newCertifications = [...certifications];
    newCertifications[index] = value;
    setCertifications(newCertifications);
  };

  // Submit handlers
  const handleResumeSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      experiences,
      education,
      certifications,
      technicalSkills,
      companyApplyingTo,
      jobTitleApplyingTo,
      isTechnicalRole,
      companyRoleDescription,
    };

    try {
      const response = await axios.post('http://localhost:8080/generate/resume', payload, {
        responseType: 'blob',
      });

      // Handle file download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Chet_Backiewicz_Resume.pdf`;
      link.click();
    } catch (error) {
      console.error('Error generating resume:', error);
    }
  };

  const handleCoverLetterSubmit = async (e) => {
    e.preventDefault();
  
    // Prepare the payload with additional cover letter fields
    const payload = {
      applicantName,
      applicantEmail,
      applicantLinkedIn,
      applicantPhone,
      applicantLocation,
      greeting,
      closer,
      applicantTitle,
      experiences,
      education,
      certifications,
      technicalSkills,
      companyApplyingTo,
      jobTitleApplyingTo,
      isTechnicalRole,
      companyRoleDescription,
    };
  
    try {
      const response = await axios.post('http://localhost:8080/generate/coverletter', payload, {
        responseType: 'blob',
      });
  
      // Handle file download (PDF)
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Chet_Backiewicz_Cover_Letter.pdf`;
      link.click();
    } catch (error) {
      console.error('Error generating cover letter:', error);
    }
  };

  return (
    <div className="App">
      <h1>Resume and Cover Letter Generator</h1>
      <form className="form">

        {/* Applicant Information */}
        <div className="form-group">
          <label>Full Name:</label>
          <input
            type="text"
            value={applicantName}
            onChange={(e) => setApplicantName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            value={applicantEmail}
            onChange={(e) => setApplicantEmail(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>LinkedIn Profile:</label>
          <input
            type="text"
            value={applicantLinkedIn}
            onChange={(e) => setApplicantLinkedIn(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Phone:</label>
          <input
            type="tel"
            value={applicantPhone}
            onChange={(e) => setApplicantPhone(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Location:</label>
          <input
            type="text"
            value={applicantLocation}
            onChange={(e) => setApplicantLocation(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Greeting (e.g., Dear):</label>
          <input
            type="text"
            value={greeting}
            onChange={(e) => setGreeting(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Closer (e.g., Sincerely):</label>
          <input
            type="text"
            value={closer}
            onChange={(e) => setCloser(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Applicant's Current Title:</label>
          <input
            type="text"
            value={applicantTitle}
            onChange={(e) => setApplicantTitle(e.target.value)}
          />
        </div>

        {/* Technical Skills */}
        <div className="form-group">
          <label>Technical Skills:</label>
          <textarea
            value={technicalSkills}
            onChange={(e) => setTechnicalSkills(e.target.value)}
            rows="4"
          />
        </div>

        {/* Experiences */}
        <div className="form-group">
          <label>Experiences:</label>
          {experiences.map((exp, index) => (
            <div key={index} className="experience-entry">
              <input
                type="text"
                placeholder="Company Name"
                value={exp.companyName}
                onChange={(e) => updateExperience(index, 'companyName', e.target.value)}
              />
              <input
                type="text"
                placeholder="Job Title"
                value={exp.jobTitle}
                onChange={(e) => updateExperience(index, 'jobTitle', e.target.value)}
              />
              <input
                type="text"
                placeholder="Start Date"
                value={exp.startDate}
                onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
              />
              <input
                type="text"
                placeholder="End Date"
                value={exp.endDate}
                onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
              />
              <label>Responsibilities:</label>
              {exp.responsibilities.map((res, resIndex) => (
                <input
                  key={resIndex}
                  type="text"
                  placeholder={`Responsibility ${resIndex + 1}`}
                  value={res}
                  onChange={(e) => updateResponsibility(index, resIndex, e.target.value)}
                />
              ))}
              <button type="button" onClick={() => addResponsibility(index)}>Add Responsibility</button>
              <hr />
            </div>
          ))}
          <button type="button" onClick={addExperience}>Add Experience</button>
        </div>

        {/* Education */}
        <div className="form-group">
          <label>Education:</label>
          {education.map((edu, index) => (
            <div key={index} className="education-entry">
              <input
                type="text"
                placeholder="Institution"
                value={edu.institution}
                onChange={(e) => updateEducation(index, 'institution', e.target.value)}
              />
              <input
                type="text"
                placeholder="Degree"
                value={edu.degree}
                onChange={(e) => updateEducation(index, 'degree', e.target.value)}
              />
              <input
                type="text"
                placeholder="Start Date"
                value={edu.startDate}
                onChange={(e) => updateEducation(index, 'startDate', e.target.value)}
              />
              <input
                type="text"
                placeholder="End Date"
                value={edu.endDate}
                onChange={(e) => updateEducation(index, 'endDate', e.target.value)}
              />
              <hr />
            </div>
          ))}
          <button type="button" onClick={addEducationEntry}>Add Education</button>
        </div>

        {/* Certifications */}
        <div className="form-group">
          <label>Certifications:</label>
          {certifications.map((cert, index) => (
            <div key={index}>
              <input
                type="text"
                placeholder="Certification"
                value={cert}
                onChange={(e) => updateCertification(index, e.target.value)}
              />
            </div>
          ))}
          <button type="button" onClick={addCertification}>Add Certification</button>
        </div>

        {/* Job Application Details */}
        <div className="form-group">
          <label>Company Applying To:</label>
          <input
            type="text"
            value={companyApplyingTo}
            onChange={(e) => setCompanyApplyingTo(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Job Title Applying To:</label>
          <input
            type="text"
            value={jobTitleApplyingTo}
            onChange={(e) => setJobTitleApplyingTo(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Type of Role:</label>
          <select
            value={isTechnicalRole}
            onChange={(e) => setIsTechnicalRole(e.target.value === 'true')}
          >
            <option value="true">Technical</option>
            <option value="false">Non-Technical</option>
          </select>
        </div>
        <div className="form-group">
          <label>Company Role Description:</label>
          <textarea
            value={companyRoleDescription}
            onChange={(e) => setCompanyRoleDescription(e.target.value)}
            rows="6"
          />
        </div>

        {/* Submit Buttons */}
        <div className="button-group">
          <button type="button" onClick={handleResumeSubmit}>
            Generate Resume
          </button>
        </div>
        <div className="button-group">
          <button type="button" onClick={handleCoverLetterSubmit}>
            Generate Cover Letter
          </button>
        </div>
      </form>
    </div>
  );
}

export default App;