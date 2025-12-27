"use client";

import { useState, useEffect } from 'react';
import { INTAKE_STEPS, EMERGENCY_SYMPTOMS } from '@/lib/constants';
import type { IntakeStep, IntakeState } from '@/lib/intake';

interface IntakeFlowProps {
  chatId: string | null;
  onComplete: (chatId: string) => void;
}

interface ChatMessage {
  type: 'question' | 'answer';
  content: string;
  step: IntakeStep;
}

export default function IntakeFlow({ chatId, onComplete }: IntakeFlowProps) {
  const [state, setState] = useState<IntakeState>({
    step: INTAKE_STEPS.AGE,
    age: null,
    sex: null,
    complaint: null,
    duration: null,
    emergency: null,
    emergencySymptoms: [],
    conditions: null,
    medications: null,
  });

  // Initialize messages with first question directly to prevent duplicates
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const getStepQuestion = (step: IntakeStep): string => {
      switch (step) {
        case INTAKE_STEPS.AGE:
          return 'Hi! I\'m here to help. To get started, what is your age?';
        case INTAKE_STEPS.SEX:
          return 'What is your sex?';
        case INTAKE_STEPS.PROBLEM:
          return 'What is your main problem or concern?';
        case INTAKE_STEPS.DURATION:
          return 'How long have you been experiencing this?';
        case INTAKE_STEPS.EMERGENCY:
          return 'Are you experiencing any of these emergency symptoms?';
        case INTAKE_STEPS.CONDITIONS:
          return 'Do you have any existing medical conditions? (Type "NO" if none)';
        case INTAKE_STEPS.MEDICATIONS:
          return 'Are you currently taking any medications? (Type "NO" if none)';
        default:
          return '';
      }
    };
    return [{ type: 'question', content: getStepQuestion(INTAKE_STEPS.AGE), step: INTAKE_STEPS.AGE }];
  });
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  const getStepQuestion = (step: IntakeStep): string => {
    switch (step) {
      case INTAKE_STEPS.AGE:
        return 'Hi! I\'m here to help. To get started, what is your age?';
      case INTAKE_STEPS.SEX:
        return 'What is your sex?';
      case INTAKE_STEPS.PROBLEM:
        return 'What is your main problem or concern?';
      case INTAKE_STEPS.DURATION:
        return 'How long have you been experiencing this?';
      case INTAKE_STEPS.EMERGENCY:
        return 'Are you experiencing any of these emergency symptoms?';
      case INTAKE_STEPS.CONDITIONS:
        return 'Do you have any existing medical conditions? (Type "NO" if none)';
      case INTAKE_STEPS.MEDICATIONS:
        return 'Are you currently taking any medications? (Type "NO" if none)';
      default:
        return '';
    }
  };

  const checkIntakeStatus = async () => {
    if (!chatId) return;
    try {
      const response = await fetch(`/api/intake?chatId=${chatId}`);
      const data = await response.json();
      if (data.completed) {
        onComplete(chatId);
      }
    } catch (error) {
      console.error('Failed to check intake status:', error);
    }
  };

  useEffect(() => {
    // Check if intake is already complete (only if chatId exists)
    if (chatId) {
      checkIntakeStatus();
    }
  }, [chatId]);

  const addQuestion = (step: Exclude<IntakeStep, typeof INTAKE_STEPS.COMPLETE>) => {
    setMessages(prev => {
      // Check if this question already exists to prevent duplicates
      const questionExists = prev.some(msg => msg.type === 'question' && msg.step === step);
      if (questionExists) return prev;
      return [...prev, { type: 'question', content: getStepQuestion(step), step }];
    });
  };

  const addAnswer = (content: string) => {
    setMessages(prev => [...prev, { type: 'answer', content, step: state.step }]);
  };

  const handleSubmit = async (overrideValue?: string) => {
    if (isSubmitting) return;

    let value: any = overrideValue || inputValue.trim();

    // Validate and process based on step
    switch (state.step) {
      case INTAKE_STEPS.AGE:
        const age = parseInt(value);
        if (isNaN(age) || age <= 0 || age >= 150) {
          alert('Please enter a valid age');
          return;
        }
        value = age;
        break;

      case INTAKE_STEPS.SEX:
        if (!['Male', 'Female'].includes(value)) {
          alert('Please select Male or Female');
          return;
        }
        break;

      case INTAKE_STEPS.EMERGENCY:
        // This will be handled separately with checkboxes
        return;

      default:
        if (!value) {
          alert('Please provide an answer');
          return;
        }
    }

    setIsSubmitting(true);
    addAnswer(value);

    // Update state
    const newState = { ...state };
    switch (state.step) {
      case INTAKE_STEPS.AGE:
        newState.age = value;
        break;
      case INTAKE_STEPS.SEX:
        newState.sex = value as 'Male' | 'Female';
        break;
      case INTAKE_STEPS.PROBLEM:
        newState.complaint = value;
        break;
      case INTAKE_STEPS.DURATION:
        newState.duration = value;
        break;
      case INTAKE_STEPS.CONDITIONS:
        newState.conditions = value.toUpperCase() === 'NO' ? null : value;
        break;
      case INTAKE_STEPS.MEDICATIONS:
        newState.medications = value.toUpperCase() === 'NO' ? null : value;
        break;
    }

    // Move to next step
    const stepOrder = [
      INTAKE_STEPS.AGE,
      INTAKE_STEPS.SEX,
      INTAKE_STEPS.PROBLEM,
      INTAKE_STEPS.DURATION,
      INTAKE_STEPS.EMERGENCY,
      INTAKE_STEPS.CONDITIONS,
      INTAKE_STEPS.MEDICATIONS,
    ];

    const currentIndex = stepOrder.indexOf(state.step as Exclude<IntakeStep, typeof INTAKE_STEPS.COMPLETE>);
    if (currentIndex >= 0 && currentIndex < stepOrder.length - 1) {
      newState.step = stepOrder[currentIndex + 1];
      setState(newState);
      setInputValue('');
      setIsSubmitting(false);
      // Add next question after a brief delay
      if (newState.step === INTAKE_STEPS.EMERGENCY) {
        // For emergency step, add question immediately so it shows in the UI
        setTimeout(() => {
          addQuestion(INTAKE_STEPS.EMERGENCY);
        }, 300);
      } else {
        setTimeout(() => {
          addQuestion(newState.step as Exclude<IntakeStep, typeof INTAKE_STEPS.COMPLETE>);
        }, 300);
      }
    } else {
      // All steps done, create chat (if needed) and save intake
      const finalChatId = await ensureChatExists();
      if (finalChatId) {
        await saveIntakeData(newState, finalChatId);
        setTimeout(() => {
          addAnswer('All done!');
          setTimeout(() => onComplete(finalChatId), 500);
        }, 300);
      } else {
        console.error('Failed to create chat');
        alert('Failed to create chat. Please try again.');
      }
    }
  };

  const handleEmergencySubmit = async (symptoms: string[]) => {
    setIsSubmitting(true);
    const answerText = symptoms.length > 0 
      ? `Yes: ${symptoms.join(', ')}` 
      : 'No';
    addAnswer(answerText);

    const newState = {
      ...state,
      emergency: symptoms.length > 0,
      emergencySymptoms: symptoms,
      step: INTAKE_STEPS.CONDITIONS,
    };

    setState(newState);
    setInputValue('');
    setIsSubmitting(false);
    
    // Add emergency question to messages if not already there
    setTimeout(() => {
      setMessages(prev => {
        const hasQuestion = prev.some(msg => msg.step === INTAKE_STEPS.EMERGENCY && msg.type === 'question');
        if (!hasQuestion) {
          return [...prev, { type: 'question', content: getStepQuestion(INTAKE_STEPS.EMERGENCY), step: INTAKE_STEPS.EMERGENCY }];
        }
        return prev;
      });
    }, 100);
    
    if (symptoms.length > 0) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          type: 'question',
          content: '⚠️ Emergency symptoms detected. Please seek immediate medical attention if severe. We\'ll continue with the intake.',
          step: INTAKE_STEPS.EMERGENCY,
        }]);
        setTimeout(() => addQuestion(INTAKE_STEPS.CONDITIONS), 500);
      }, 300);
    } else {
      setTimeout(() => addQuestion(INTAKE_STEPS.CONDITIONS), 300);
    }
  };

  const ensureChatExists = async (): Promise<string | null> => {
    // If chatId already exists, return it
    if (chatId) {
      return chatId;
    }

    // Create new chat
    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
      });
      const data = await response.json();
      if (response.ok && data.chatId) {
        // Update localStorage
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7);
        localStorage.setItem('dr_rajeev_chat_id', data.chatId);
        localStorage.setItem('dr_rajeev_chat_expiry', expiryDate.toISOString());
        return data.chatId;
      } else {
        console.error('Failed to create chat:', data.error || 'Unknown error');
        return null;
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
      return null;
    }
  };

  const saveIntakeData = async (finalState: IntakeState, finalChatId: string) => {
    try {
      const response = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: finalChatId,
          age: finalState.age,
          sex: finalState.sex,
          complaint: finalState.complaint,
          duration: finalState.duration,
          emergency: finalState.emergency,
          emergencySymptoms: finalState.emergencySymptoms,
          conditions: finalState.conditions,
          medications: finalState.medications,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('Failed to save intake data:', data.error);
        throw new Error(data.error || 'Failed to save intake data');
      }
    } catch (error) {
      console.error('Error saving intake data:', error);
      throw error;
    }
  };

  // Emergency step UI
  if (state.step === INTAKE_STEPS.EMERGENCY) {
    return (
      <>
        {/* Show previous messages */}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.type === 'answer' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                msg.type === 'answer'
                  ? 'bg-[#017CA6] text-white rounded-br-sm'
                  : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm shadow-sm'
              }`}
            >
              <p className="text-sm leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}

        {/* Emergency question with checkboxes - only show if question is in messages */}
        {messages.some(msg => msg.step === state.step && msg.type === 'question') && (
          <div className="flex justify-start">
            <div className="max-w-[75%] rounded-2xl rounded-bl-sm bg-white text-gray-900 border border-gray-200 shadow-sm px-4 py-2.5">
              <p className="text-sm leading-relaxed mb-3">{getStepQuestion(state.step)}</p>
              <div className="space-y-2">
                {EMERGENCY_SYMPTOMS.map((symptom) => (
                  <label key={symptom} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={selectedSymptoms.includes(symptom)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSymptoms([...selectedSymptoms, symptom]);
                        } else {
                          setSelectedSymptoms(selectedSymptoms.filter((s) => s !== symptom));
                        }
                      }}
                      className="w-4 h-4 text-[#017CA6] border-gray-300 rounded focus:ring-[#017CA6]"
                    />
                    <span className="text-sm text-gray-700 capitalize">{symptom}</span>
                  </label>
                ))}
              </div>
              <button
                onClick={() => handleEmergencySubmit(selectedSymptoms)}
                disabled={isSubmitting}
                className="mt-3 w-full px-4 py-2 bg-[#017CA6] text-white rounded-lg hover:bg-[#016a8f] transition-colors disabled:opacity-50 text-sm"
              >
                Continue
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Regular input step
  return (
    <>
      {/* Show previous messages */}
      {messages.map((msg, idx) => (
        <div
          key={idx}
          className={`flex ${msg.type === 'answer' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
              msg.type === 'answer'
                ? 'bg-[#017CA6] text-white rounded-br-sm'
                : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm shadow-sm'
            }`}
          >
            <p className="text-sm leading-relaxed">{msg.content}</p>
          </div>
        </div>
      ))}

      {/* Input form - only show if we have the question in messages */}
      {state.step !== INTAKE_STEPS.COMPLETE && messages.some(msg => msg.step === state.step && msg.type === 'question') && (
        <>
          {state.step === INTAKE_STEPS.SEX ? (
            <div className="flex justify-end">
              <div className="max-w-[75%] flex flex-col gap-2">
                {['Male', 'Female'].map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setInputValue(option);
                      handleSubmit(option);
                    }}
                    className="px-4 py-2 bg-[#017CA6] text-white rounded-2xl rounded-br-sm hover:bg-[#016a8f] transition-colors text-sm text-left"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className="flex justify-end w-full"
            >
              <div className="w-full flex gap-2">
                <input
                  type={state.step === INTAKE_STEPS.AGE ? 'number' : 'text'}
                  value={inputValue}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (state.step === INTAKE_STEPS.AGE) {
                      // Only allow positive numbers
                      if (val === '' || (parseInt(val) > 0 && parseInt(val) < 150)) {
                        setInputValue(val);
                      }
                    } else {
                      setInputValue(val);
                    }
                  }}
                  placeholder={state.step === INTAKE_STEPS.AGE ? 'Enter your age' : 'Type your answer...'}
                  min={state.step === INTAKE_STEPS.AGE ? '1' : undefined}
                  max={state.step === INTAKE_STEPS.AGE ? '149' : undefined}
                  className="flex-1 w-full px-4 py-2.5 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#017CA6] focus:border-transparent text-sm text-gray-900 bg-white"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !inputValue.trim()}
                  className="w-10 h-10 bg-[#017CA6] text-white rounded-2xl hover:bg-[#016a8f] transition-colors disabled:opacity-50 flex items-center justify-center flex-shrink-0"
                  aria-label="Send"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </>
  );
}
