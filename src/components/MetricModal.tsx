import { Fragment, useRef, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';

interface MetricModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  value: string;
  changePercent: number;
  description: string;
  darkMode?: boolean;
}

export default function MetricModal({
  open,
  onClose,
  title,
  value,
  changePercent,
  description,
  darkMode = false
}: MetricModalProps) {
  const cancelButtonRef = useRef(null);
  const isPositive = changePercent > 0;
  const changeText = `${isPositive ? '+' : ''}${changePercent.toFixed(1)}%`;

  // Close modal with escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [open, onClose]);

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        initialFocus={cancelButtonRef}
        onClose={onClose}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className={`relative transform overflow-hidden rounded-lg ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg`}>
                <div className="px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                      <Dialog.Title as="h3" className={`text-lg font-semibold leading-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {title}
                      </Dialog.Title>
                      
                      <div className="mt-4 flex items-center space-x-2">
                        <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {value}
                        </div>
                        <div className={`flex items-center ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                          <svg 
                            className="w-4 h-4" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d={isPositive 
                                ? "M5 10l7-7m0 0l7 7m-7-7v18" 
                                : "M19 14l-7 7m0 0l-7-7m7 7V3"} 
                            />
                          </svg>
                          <span className="text-sm font-medium ml-0.5">{changeText}</span>
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {description.split('\n').map((paragraph, index) => (
                            <p key={index} className="mb-3">
                              {paragraph}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className={`px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 ${darkMode ? 'border-t border-gray-700' : 'border-t border-gray-200'}`}>
                  <button
                    type="button"
                    className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm sm:ml-3 sm:w-auto
                      ${darkMode 
                        ? 'bg-emerald-700 text-white hover:bg-emerald-600 focus:ring-emerald-600' 
                        : 'bg-emerald-600 text-white hover:bg-emerald-500 focus:ring-emerald-500'
                      } focus:outline-none focus:ring-2 focus:ring-offset-2`}
                    onClick={onClose}
                  >
                    Got it
                  </button>
                  <button
                    type="button"
                    className={`mt-3 inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold sm:mt-0 sm:w-auto 
                      ${darkMode 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 focus:ring-gray-600' 
                        : 'bg-white text-gray-900 hover:bg-gray-50 focus:ring-gray-200'
                      } focus:outline-none focus:ring-2 focus:ring-offset-2 border`}
                    onClick={onClose}
                    ref={cancelButtonRef}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 