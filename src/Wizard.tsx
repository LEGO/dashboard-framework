import { useState } from "react";

import { Step1Basics } from "./components/info.tsx";
import { Step2SRE } from "./components/sre.tsx";
import { Step3Metrics } from "./components/metrics.tsx";
import { Step4Logs } from "./components/logs.tsx";
import { Step5Output } from "./components/output.tsx";

// Main Wizard Component
export function Wizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    dashboardName: '',
    dashboardDescription: '',
    sreEnabled: false,
    sliTarget: '',
    metrics: [{ name: '', isSli: false, query: '', querySuccess: '', queryErrors: '' }],
    logsServiceName: '',
    logsIsJson: false,
    logsFilters: []
  });
  const [errors, setErrors] = useState({});

  const steps = [
    { id: 1, label: 'Basics', component: Step1Basics },
    { id: 2, label: 'SRE', component: Step2SRE },
    { id: 3, label: 'Metrics', component: Step3Metrics },
    { id: 4, label: 'Logs', component: Step4Logs },
    { id: 5, label: 'Output', component: Step5Output },
  ];

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addMetric = () => {
    setFormData(prev => ({
      ...prev,
      metrics: [...prev.metrics, { name: '', isSli: false, query: '', querySuccess: '', queryErrors: '' }]
    }));
  };

  const removeMetric = (idx) => {
    setFormData(prev => ({
      ...prev,
      metrics: prev.metrics.filter((_, i) => i !== idx)
    }));
  };

  const updateMetric = (idx, field, value) => {
    setFormData(prev => {
      const newMetrics = [...prev.metrics];
      newMetrics[idx] = { ...newMetrics[idx], [field]: value };
      return { ...prev, metrics: newMetrics };
    });
    if (errors[`metric_${idx}_${field}`]) {
      setErrors(prev => ({ ...prev, [`metric_${idx}_${field}`]: '' }));
    }
  };

  const addLogsFilter = () => {
    setFormData(prev => ({
      ...prev,
      logsFilters: [...prev.logsFilters, { key: '', value: '' }]
    }));
  };

  const removeLogsFilter = (filterIdx) => {
    setFormData(prev => ({
      ...prev,
      logsFilters: prev.logsFilters.filter((_, i) => i !== filterIdx)
    }));
  };

  const validateStep = (stepNum) => {
    const newErrors = {};

    if (stepNum === 1) {
      if (!formData.dashboardName.trim()) {
        newErrors.dashboardName = 'Dashboard name is required';
      }
    }

    if (stepNum === 2) {
      if (formData.sreEnabled && !formData.sliTarget) {
        newErrors.sliTarget = 'SLI target is required when SRE is enabled';
      }
      if (formData.sreEnabled && (parseFloat(formData.sliTarget) <= 0 || parseFloat(formData.sliTarget) > 100)) {
        newErrors.sliTarget = 'SLI target must be between 0 and 100';
      }
    }

    if (stepNum === 3) {
      if (!formData.metrics || formData.metrics.length === 0) {
        newErrors.metrics = 'At least one metric is required';
      } else {
        formData.metrics.forEach((metric, idx) => {
          if (!metric.name.trim()) newErrors[`metric_${idx}_name`] = 'Metric name is required';
          if (metric.isSli) {
            if (!metric.querySuccess.trim()) newErrors[`metric_${idx}_querySuccess`] = 'Success query is required';
            if (!metric.queryErrors.trim()) newErrors[`metric_${idx}_queryErrors`] = 'Errors query is required';
          } else {
            if (!metric.query.trim()) newErrors[`metric_${idx}_query`] = 'Query is required';
          }
        });
      }
    }

    if (stepNum === 4) {
      if (!formData.logsServiceName.trim()) {
        newErrors.logsServiceName = 'Service name is required';
      }
    }

    setErrors(newErrors);
    console.log(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    setErrors({});
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = () => {
    if (validateStep(currentStep)) {
      setSubmitted(true);
      console.log('Dashboard config submitted:', formData);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setSubmitted(false);
    setFormData({
      dashboardName: '',
      dashboardDescription: '',
      sreEnabled: false,
      sliTarget: '',
      metrics: [{ name: '', isSli: false, query: '', querySuccess: '', queryErrors: '' }],
      logsEnabled: false,
      logsServiceName: '',
      logsIsJson: false,
      logsFilters: []
    });
    setErrors({});
  };

  if (submitted) {
    return (
      <div className="wizard-container">
        <div className="wizard-header">
          <h1>✨ Success!</h1>
        </div>
        <div className="wizard-content">
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h2>Dashboard Template Generated!</h2>
            <p>Your Grafana dashboard configuration has been generated and copied to your clipboard. You can now use it to create your dashboard.</p>
            <button className="btn btn-primary" onClick={handleReset}>
              Create Another Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const CurrentStepComponent = steps[currentStep - 1].component;
  const isLastStep = currentStep === steps.length;
  return (
    <div className="wizard-container">
      <div className="wizard-header">
        <h1>📊 Grafana Dashboard Wizard</h1>
        <p>Create your observability dashboard configuration</p>
      </div>

      <div className="step-indicator">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`step ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''
              }`}
          >
            <div className="step-number">
              {currentStep > step.id ? '✓' : step.id}
            </div>
            <div className="step-label">{step.label}</div>
          </div>
        ))}
      </div>
      <div className="wizard-content">
        {currentStep === 3 ? (
          <CurrentStepComponent
            formData={formData}
            updateField={updateField}
            errors={errors}
            addMetric={addMetric}
            removeMetric={removeMetric}
            updateMetric={updateMetric}
          />
        ) : currentStep === 4 ? (
          <CurrentStepComponent
            formData={formData}
            updateField={updateField}
            errors={errors}
            addLogsFilter={addLogsFilter}
            removeLogsFilter={removeLogsFilter}
          />
        ) : (
          <CurrentStepComponent
            formData={formData}
            updateField={updateField}
            errors={errors}
          />
        )}
      </div>

      <div className="wizard-footer">
        <button
          className="btn btn-secondary"
          onClick={handlePrevious}
          disabled={currentStep === 1}
        >
          ← Previous
        </button>
        <div style={{ fontSize: '12px', color: '#64748b', alignSelf: 'center' }}>
          Step {currentStep} of {steps.length}
        </div>
        {!isLastStep ? (
          <button className="btn btn-primary" onClick={handleNext}>
            Next →
          </button>
        ) : (
          <button className="btn btn-primary" onClick={handleSubmit}>
            Generate Template ✓
          </button>
        )}
      </div>
    </div>
  );
}

