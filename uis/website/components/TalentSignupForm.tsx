"use client";

import { FormEvent, useMemo, useState } from "react";

type FormValues = {
  fullName: string;
  email: string;
  phone: string;
  country: string;
  experience: string;
  sector: string;
  englishLevel: string;
  availability: string;
  linkedin: string;
  comments: string;
  policy: boolean;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const INITIAL_VALUES: FormValues = {
  fullName: "",
  email: "",
  phone: "",
  country: "",
  experience: "",
  sector: "",
  englishLevel: "",
  availability: "",
  linkedin: "",
  comments: "",
  policy: false,
};

const MESSAGES = {
  fullName: "Name must contain at least first and last name",
  email: "Enter a valid email (example: <name@company.com>)",
  phone: "Phone must include country code (example: +34 612 345 678)",
  country: "Select your country of residence",
  experience: "Years of experience must be between 0 and 50",
  sector: "Select your sector of interest",
  englishLevel: "Indicate your English level",
  availability: "Select your availability",
  linkedin: "If you include LinkedIn, it must be a valid URL",
  comments: "Comments cannot exceed 500 characters ({remaining} remaining)",
  policy: "You must accept the data processing policy to continue",
  summary: "Please fix the highlighted fields before submitting.",
};

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (values.fullName.trim().split(/\s+/).filter(Boolean).length < 2) {
    errors.fullName = MESSAGES.fullName;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = MESSAGES.email;
  }

  if (!/^\+[0-9]{1,3}(?:\s[0-9]{2,4}){2,4}$/.test(values.phone.trim())) {
    errors.phone = MESSAGES.phone;
  }

  if (!values.country) {
    errors.country = MESSAGES.country;
  }

  const exp = Number(values.experience);
  if (
    values.experience === "" ||
    !Number.isFinite(exp) ||
    exp < 0 ||
    exp > 50
  ) {
    errors.experience = MESSAGES.experience;
  }

  if (!values.sector) {
    errors.sector = MESSAGES.sector;
  }

  if (!values.englishLevel) {
    errors.englishLevel = MESSAGES.englishLevel;
  }

  if (!values.availability) {
    errors.availability = MESSAGES.availability;
  }

  if (
    values.linkedin.trim() &&
    !/^https?:\/\/.+/i.test(values.linkedin.trim())
  ) {
    errors.linkedin = MESSAGES.linkedin;
  }

  if (values.comments.length > 500) {
    const remaining = 500 - values.comments.length;
    errors.comments = MESSAGES.comments.replace(
      "{remaining}",
      String(remaining),
    );
  }

  if (!values.policy) {
    errors.policy = MESSAGES.policy;
  }

  return errors;
}

export function TalentSignupForm() {
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showSummary, setShowSummary] = useState(false);
  const [success, setSuccess] = useState(false);

  const commentsRemaining = useMemo(
    () => 500 - values.comments.length,
    [values.comments.length],
  );

  const update = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setSuccess(false);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validate(values);
    setErrors(validation);
    const hasErrors = Object.keys(validation).length > 0;
    setShowSummary(hasErrors);

    if (!hasErrors) {
      setSuccess(true);
      setValues(INITIAL_VALUES);
    }
  };

  return (
    <section className="form-wrap" aria-labelledby="form-title">
      {showSummary && <div className="summary">{MESSAGES.summary}</div>}
      {success && (
        <section className="success" aria-live="polite">
          <h2>Thank you for your interest in Nexova!</h2>
          <p>
            We have received your information. Our selection team will review it
            and contact you if your profile matches any of our current or future
            opportunities.
          </p>
          <p>
            In the meantime, follow us on LinkedIn to stay updated on our
            vacancies and professional development content.
          </p>
        </section>
      )}

      <form noValidate onSubmit={onSubmit}>
        <p>Fields marked with * are required.</p>

        <fieldset>
          <legend>Personal details</legend>
          <label>
            Full name *
            <input
              value={values.fullName}
              onChange={(e) => update("fullName", e.target.value)}
            />
            <span className="error">{errors.fullName}</span>
          </label>

          <div className="input-row">
            <label>
              Email *
              <input
                type="email"
                value={values.email}
                onChange={(e) => update("email", e.target.value)}
              />
              <span className="error">{errors.email}</span>
            </label>

            <label>
              Phone *
              <input
                value={values.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
              <span className="error">{errors.phone}</span>
            </label>
          </div>

          <label>
            Country of residence *
            <select
              value={values.country}
              onChange={(e) => update("country", e.target.value)}
            >
              <option value="">Select an option</option>
              <option value="spain">Spain</option>
              <option value="united-states">United States</option>
              <option value="other">Other</option>
            </select>
            <span className="error">{errors.country}</span>
          </label>
        </fieldset>

        <fieldset>
          <legend>Professional profile</legend>
          <label>
            Years of experience *
            <input
              type="number"
              min={0}
              max={50}
              value={values.experience}
              onChange={(e) => update("experience", e.target.value)}
            />
            <span className="error">{errors.experience}</span>
          </label>

          <div className="input-row">
            <label>
              Sector of interest *
              <select
                value={values.sector}
                onChange={(e) => update("sector", e.target.value)}
              >
                <option value="">Select an option</option>
                <option value="technology">Technology</option>
                <option value="retail">Retail</option>
                <option value="financial-services">Financial Services</option>
                <option value="consulting">Consulting</option>
                <option value="other">Other</option>
              </select>
              <span className="error">{errors.sector}</span>
            </label>

            <label>
              English level *
              <select
                value={values.englishLevel}
                onChange={(e) => update("englishLevel", e.target.value)}
              >
                <option value="">Select an option</option>
                <option value="basic">Basic</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="native">Native</option>
              </select>
              <span className="error">{errors.englishLevel}</span>
            </label>
          </div>

          <label>
            Availability *
            <div className="radios">
              {[
                ["immediate", "Immediate"],
                ["1-month", "1 month"],
                ["2-3-months", "2-3 months"],
                ["exploring", "Just exploring"],
              ].map(([value, label]) => (
                <span className="radio" key={value}>
                  <input
                    type="radio"
                    checked={values.availability === value}
                    onChange={() => update("availability", value)}
                  />
                  {label}
                </span>
              ))}
            </div>
            <span className="error">{errors.availability}</span>
          </label>

          <label>
            LinkedIn (profile URL)
            <input
              value={values.linkedin}
              onChange={(e) => update("linkedin", e.target.value)}
            />
            <span className="error">{errors.linkedin}</span>
          </label>

          <label>
            Additional comments
            <textarea
              rows={5}
              value={values.comments}
              onChange={(e) => update("comments", e.target.value)}
            />
            <span>{commentsRemaining} characters remaining</span>
            <span className="error">{errors.comments}</span>
          </label>
        </fieldset>

        <fieldset>
          <legend>Data policy</legend>
          <label className="radio">
            <input
              type="checkbox"
              checked={values.policy}
              onChange={(e) => update("policy", e.target.checked)}
            />
            I accept the data policy
          </label>
          <span className="error">{errors.policy}</span>
        </fieldset>

        <button className="button" type="submit">
          Submit application
        </button>
      </form>
    </section>
  );
}
