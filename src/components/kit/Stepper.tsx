import React from 'react';

export interface StepItem {
  id: string | number;
  title: string;
  description?: string;
}

export interface StepperProps {
  steps: StepItem[];
  currentStep: number; // 0-indexed
  onStepClick?: (stepIndex: number) => void;
  direction?: 'horizontal' | 'vertical';
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStep,
  onStepClick,
  direction = 'horizontal',
  className = '',
}) => {
  if (direction === 'vertical') {
    return (
      <div className={`space-y-4 ${className}`}>
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isCurrent = idx === currentStep;
          const isUpcoming = idx > currentStep;

          return (
            <div
              key={step.id}
              onClick={() => onStepClick && onStepClick(idx)}
              className={`flex items-start gap-3.5 ${
                onStepClick ? 'cursor-pointer' : ''
              }`}
            >
              <div className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                    isCompleted
                      ? 'bg-[#1F8FA6] text-white shadow-[0_2px_8px_rgba(43,179,201,0.3)]'
                      : isCurrent
                      ? 'border-2 border-[#1F8FA6] text-[#1F8FA6] bg-transparent font-extrabold'
                      : 'border border-[#E7E7E2] dark:border-white/20 text-[#8C928E] dark:text-[#5F6C70]'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`w-0.5 h-8 mt-1 ${
                      isCompleted ? 'bg-[#1F8FA6]' : 'bg-[#E7E7E2] dark:bg-white/10'
                    }`}
                  />
                )}
              </div>

              <div className="pt-0.5">
                <div
                  className={`text-sm font-semibold ${
                    isCurrent
                      ? 'text-[#1F8FA6] dark:text-[#5FD3E8]'
                      : isCompleted
                      ? 'text-[#111312] dark:text-[#F2F6F7]'
                      : 'text-[#8C928E] dark:text-[#5F6C70]'
                  }`}
                >
                  {step.title}
                </div>
                {step.description && (
                  <div className="text-xs text-[#5E6460] dark:text-[#9AA7AB] mt-0.5">
                    {step.description}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between w-full ${className}`}>
      {steps.map((step, idx) => {
        const isCompleted = idx < currentStep;
        const isCurrent = idx === currentStep;

        return (
          <React.Fragment key={step.id}>
            <div
              onClick={() => onStepClick && onStepClick(idx)}
              className={`flex items-center gap-2.5 ${onStepClick ? 'cursor-pointer' : ''}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                  isCompleted
                    ? 'bg-[#1F8FA6] text-white shadow-[0_2px_8px_rgba(43,179,201,0.3)]'
                    : isCurrent
                    ? 'border-2 border-[#1F8FA6] text-[#1F8FA6] bg-transparent font-extrabold ring-4 ring-[#1F8FA6]/15'
                    : 'border border-[#E7E7E2] dark:border-white/20 text-[#8C928E] dark:text-[#5F6C70]'
                }`}
              >
                {isCompleted ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>

              <div className="hidden sm:block">
                <div
                  className={`text-xs font-semibold ${
                    isCurrent
                      ? 'text-[#1F8FA6] dark:text-[#5FD3E8]'
                      : isCompleted
                      ? 'text-[#111312] dark:text-[#F2F6F7]'
                      : 'text-[#8C928E] dark:text-[#5F6C70]'
                  }`}
                >
                  {step.title}
                </div>
              </div>
            </div>

            {idx < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-3 transition-colors duration-200 ${
                  isCompleted ? 'bg-[#1F8FA6]' : 'bg-[#E7E7E2] dark:bg-white/10'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
