const fs = require('fs');
const filepath = 'src/app/dashboard/sites/[siteId]/page.tsx';
let content = fs.readFileSync(filepath, 'utf8');

const bad = 'className={\\inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider \\}';
const good = 'className={\inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider \\}';
content = content.replace(bad, good);

const bad_buttons = \                            <div className="flex items-center gap-2 flex-wrap">
                              {/* 1. Screenshot Proof */}
                              <button
                                type="button"
                                onClick={() => handleOpenEvidence(issue, 'screenshot')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#16181E] text-xs font-semibold text-gray-700 dark:text-gray-200 hover:border-[#ee6018] hover:text-[#ee6018] dark:hover:text-[#ee6018] transition-colors cursor-pointer shadow-2xs"
                              >
                                <Camera className="h-3.5 w-3.5 text-[#ee6018]" />
                                <span>?? Screenshot</span>
                              </button>

                              {/* 2. Network Proof */}
                              <button
                                type="button"
                                onClick={() => handleOpenEvidence(issue, 'network')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#16181E] text-xs font-semibold text-gray-700 dark:text-gray-200 hover:border-[#ee6018] hover:text-[#ee6018] dark:hover:text-[#ee6018] transition-colors cursor-pointer shadow-2xs"
                              >
                                <GlobeAltIcon className="h-3.5 w-3.5 text-[#ee6018]" />
                                <span>?? Network: HTTP 500</span>
                              </button>

                              {/* 3. Console Proof */}
                              <button
                                type="button"
                                onClick={() => handleOpenEvidence(issue, 'console')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#16181E] text-xs font-semibold text-gray-700 dark:text-gray-200 hover:border-[#ee6018] hover:text-[#ee6018] dark:hover:text-[#ee6018] transition-colors cursor-pointer shadow-2xs"
                              >
                                <Terminal className="h-3.5 w-3.5 text-[#ee6018]" />
                                <span>?? Console: 1 Error</span>
                              </button>
                            </div>\;

const good_buttons = \                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Dynamic Evidence Buttons based on real data */}
                              {(issue.evidence || []).some((e: any) => e.type === 'screenshot') && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenEvidence(issue, 'screenshot')}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#16181E] text-xs font-semibold text-gray-700 dark:text-gray-200 hover:border-[#ee6018] hover:text-[#ee6018] dark:hover:text-[#ee6018] transition-colors cursor-pointer shadow-2xs"
                                >
                                  <Camera className="h-3.5 w-3.5 text-[#ee6018]" />
                                  <span>?? Screenshot</span>
                                </button>
                              )}

                              {(issue.evidence || []).some((e: any) => e.type === 'network') && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenEvidence(issue, 'network')}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#16181E] text-xs font-semibold text-gray-700 dark:text-gray-200 hover:border-[#ee6018] hover:text-[#ee6018] dark:hover:text-[#ee6018] transition-colors cursor-pointer shadow-2xs"
                                >
                                  <GlobeAltIcon className="h-3.5 w-3.5 text-[#ee6018]" />
                                  <span>?? Network</span>
                                </button>
                              )}

                              {(issue.evidence || []).some((e: any) => e.type === 'console') && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenEvidence(issue, 'console')}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#16181E] text-xs font-semibold text-gray-700 dark:text-gray-200 hover:border-[#ee6018] hover:text-[#ee6018] dark:hover:text-[#ee6018] transition-colors cursor-pointer shadow-2xs"
                                >
                                  <Terminal className="h-3.5 w-3.5 text-[#ee6018]" />
                                  <span>?? Console</span>
                                </button>
                              )}
                            </div>\;

content = content.replace(bad_buttons, good_buttons);

fs.writeFileSync(filepath, content, 'utf8');
console.log('Fixed file.');
