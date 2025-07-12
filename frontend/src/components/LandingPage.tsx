"use client";
import * as React from "react";
import Link from "next/link";

function LandingPage() {
  return (
    <div className="flex overflow-hidden flex-col bg-gray-600">
      <div className="w-full max-w-[1360px] max-md:max-w-full">
        <div className="flex gap-5 max-md:flex-col">
          <div className="w-[19%] max-md:ml-0 max-md:w-full">
            <div className="flex overflow-hidden flex-col items-center px-px py-7 mx-auto w-full bg-gray-700 max-md:mt-10">
              <div className="flex gap-5 justify-between items-center max-w-full text-4xl tracking-tighter whitespace-nowrap w-[197px]">
                <img
                  src="/globe.svg"
                  alt="Con4 Logo"
                  className="object-contain shrink-0 self-stretch aspect-square w-[53px]"
                />
                <div className="flex self-stretch my-auto">
                  <div className="z-10 grow mr-0 text-white">Con4</div>
                  <div className="text-blue-800">Con4</div>
                </div>
                <img
                  src="/file.svg"
                  alt="Menu"
                  className="object-contain shrink-0 self-stretch my-auto aspect-[0.95] w-[18px]"
                />
              </div>
              <div className="flex flex-col items-start self-stretch pr-2.5 pl-2.5 mt-4 w-full h-[443px]">
                <Link
                  href="/game"
                  className="flex gap-5 justify-between w-48 max-w-full text-3xl font-bold tracking-tighter text-white whitespace-nowrap hover:text-blue-300 transition-colors"
                >
                  <img
                    src="/globe.svg"
                    alt="Play"
                    className="object-contain shrink-0 w-9 aspect-square"
                  />
                  <div>Play</div>
                </Link>
                <Link
                  href="/tools/test-puzzle"
                  className="flex gap-5 justify-between mt-6 max-w-full text-3xl font-bold tracking-tighter text-white whitespace-nowrap w-[156px] hover:text-blue-300 transition-colors"
                >
                  <img
                    src="/globe.svg"
                    alt="Puzzle"
                    className="object-contain shrink-0 aspect-[1.03] w-[37px]"
                  />
                  <div className="self-start">Puzzle</div>
                </Link>
                <Link
                  href="/about-us"
                  className="flex gap-5 justify-between self-stretch py-px pr-11 mt-6 w-full text-3xl font-bold tracking-tighter text-white whitespace-nowrap max-md:pr-5 hover:text-blue-300 transition-colors"
                >
                  <img
                    src="/globe.svg"
                    alt="Learn"
                    className="object-contain shrink-0 aspect-[1.23] w-[42px]"
                  />
                  <div className="px-px pb-3 my-auto">
                    <div className="z-10 mt-0">Learn</div>
                  </div>
                </Link>
                <Link
                  href="/tools"
                  className="flex gap-10 items-start self-stretch px-1 mt-6 w-full text-3xl font-bold tracking-tighter text-white whitespace-nowrap hover:text-blue-300 transition-colors"
                >
                  <img
                    src="/globe.svg"
                    alt="Tools"
                    className="object-contain shrink-0 mt-1 w-9 aspect-square"
                  />
                  <div className="grow shrink w-32">Tools</div>
                </Link>
                <Link
                  href="/events"
                  className="flex gap-5 justify-between items-start mt-6 max-w-full text-3xl font-bold tracking-tighter text-white whitespace-nowrap w-[177px] hover:text-blue-300 transition-colors"
                >
                  <img
                    src="/globe.svg"
                    alt="Events"
                    className="object-contain shrink-0 aspect-square w-[39px]"
                  />
                  <div>Events</div>
                </Link>
                <div className="flex gap-5 justify-between mt-6 max-w-full text-2xl font-bold tracking-tight text-white whitespace-nowrap w-[199px]">
                  <img
                    src="/user.svg"
                    alt="Community"
                    className="object-contain shrink-0 self-start aspect-square w-[54px]"
                  />
                  <div>
                    Community
                    <br />
                  </div>
                </div>
                <div className="flex gap-7 items-start self-stretch mt-6 w-full max-w-[222px]">
                  <div className="flex gap-2 items-center pl-3 h-[41px]">
                    <img
                      src="/globe.svg"
                      alt="Notifications"
                      className="object-contain self-stretch my-auto aspect-[0.98] w-[43px]"
                    />
                  </div>
                  <div className="grow shrink text-2xl font-bold tracking-tight text-white w-[136px]">
                    Notifications
                  </div>
                </div>
                <div className="flex flex-col justify-center items-start py-0.5 mt-6 max-w-full text-3xl font-bold tracking-tighter text-white whitespace-nowrap w-[212px] max-md:pr-5">
                  <div className="flex gap-2 items-center py-1 pl-3 min-h-[41px]">
                    <img
                      src="/globe.svg"
                      alt="Settings"
                      className="object-contain shrink-0 self-stretch my-auto w-9 aspect-square"
                    />
                    <div className="self-stretch px-5 pb-3.5 my-auto w-[156px]">
                      <div className="z-10 mt-0">Settings</div>
                    </div>
                  </div>
                </div>
              </div>
              <Link
                href="/user"
                className="flex gap-3.5 px-2.5 py-3 mt-48 max-w-full text-xl text-white whitespace-nowrap bg-gray-600 rounded w-[168px] max-md:mt-10 hover:bg-gray-500 transition-colors"
              >
                <img
                  src="/user.svg"
                  alt="Profile"
                  className="object-contain shrink-0 rounded-full aspect-[1.08] w-[43px]"
                />
                <div className="my-auto">Profile</div>
              </Link>
            </div>
          </div>
          <div className="ml-5 w-[81%] max-md:ml-0 max-md:w-full">
            <div className="mt-28 w-full max-md:mt-10 max-md:max-w-full">
              <div className="max-md:max-w-full">
                <div className="flex gap-5 max-md:flex-col">
                  <div className="w-[55%] max-md:ml-0 max-md:w-full">
                    <div className="w-full bg-blue-800 rounded-[37px] max-md:mt-10 max-md:max-w-full">
                      <div className="flex overflow-hidden flex-col px-8 py-14 max-md:px-5 max-md:max-w-full">
                        {/* Connect 4 Board Visual */}
                        {Array.from({ length: 6 }, (_, row) => (
                          <div
                            key={row}
                            className={`flex gap-4 justify-center ${row === 0 ? "mt-0" : "mt-5"}`}
                          >
                            {Array.from({ length: 7 }, (_, col) => (
                              <div key={col} className="w-[51px]">
                                <div className="flex shrink-0 w-full bg-blue-700 rounded-full fill-blue-700 h-[51px]" />
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="ml-5 w-[45%] max-md:ml-0 max-md:w-full">
                    <div className="mt-14 max-md:mt-10 max-md:max-w-full">
                      <div className="text-4xl font-bold tracking-tighter text-white max-md:max-w-full">
                        Play the game of the mind on the best online site!
                      </div>
                      <div className="flex flex-col px-3.5 mt-5 w-full max-md:max-w-full">
                        <div className="flex gap-10 items-start self-end max-w-full w-[369px]">
                          <div className="flex flex-1 gap-2.5">
                            <div className="grow text-sm font-bold text-right text-white">
                              1,000+
                            </div>
                            <div className="text-base text-zinc-500">
                              Games Today
                            </div>
                          </div>
                          <div className="flex flex-1 gap-2.5">
                            <div className="grow text-sm font-bold text-right text-white">
                              250+
                            </div>
                            <div className="text-base text-zinc-500">
                              Playing Now
                            </div>
                          </div>
                        </div>
                        <Link
                          href="/game"
                          className="flex gap-5 justify-between px-9 pt-4 pb-7 mt-11 bg-gray-700 shadow-sm rounded-[30px] max-md:px-5 max-md:mt-10 max-md:mr-2.5 hover:bg-gray-600 transition-colors"
                        >
                          <img
                            src="/globe.svg"
                            alt="Play Online"
                            className="object-contain shrink-0 my-auto aspect-[2] w-[86px]"
                          />
                          <div className="flex flex-col">
                            <div className="self-center ml-3.5 text-2xl font-medium text-center text-white">
                              Play Online
                            </div>
                            <div className="mt-2 text-base text-zinc-500">
                              Play with someone at your level
                            </div>
                          </div>
                        </Link>
                        <Link
                          href="/game/setup"
                          className="flex gap-5 justify-between pt-3 pr-3.5 pb-7 pl-9 mt-12 bg-gray-700 shadow-sm rounded-[30px] max-md:pl-5 max-md:mt-10 max-md:mr-2.5 hover:bg-gray-600 transition-colors"
                        >
                          <img
                            src="/globe.svg"
                            alt="Play Computer"
                            className="object-contain shrink-0 self-start mt-3 aspect-[1.24] w-[67px]"
                          />
                          <div className="flex flex-col">
                            <div className="self-center text-2xl font-medium text-center text-white">
                              Play Computer
                            </div>
                            <div className="mt-3 text-base text-zinc-500">
                              Play vs customisable training bots
                            </div>
                          </div>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Solve Puzzles Section */}
              <div className="pr-16 pl-1.5 mt-36 w-full max-md:pr-5 max-md:mt-10 max-md:max-w-full">
                <div className="py-11 pr-20 pl-7 bg-gray-700 rounded-[60px] max-md:px-5 max-md:max-w-full">
                  <div className="flex gap-5 max-md:flex-col">
                    <div className="w-6/12 max-md:ml-0 max-md:w-full">
                      <div className="flex flex-col items-start self-stretch my-auto w-full text-2xl text-white max-md:mt-10">
                        <div className="ml-3.5 text-5xl font-semibold tracking-tighter max-md:ml-2.5 max-md:text-4xl">
                          Solve Puzzles
                        </div>
                        <Link
                          href="/tools/test-puzzle"
                          className="flex gap-2 items-center px-8 py-5 mt-12 font-medium text-center shadow-sm bg-slate-600 min-h-[74px] rounded-[30px] max-md:px-5 max-md:mt-10 hover:bg-slate-500 transition-colors"
                        >
                          <div className="flex-1 shrink self-stretch my-auto basis-0">
                            Solve Puzzles
                          </div>
                        </Link>
                        <div className="self-stretch mt-20 ml-8 leading-9 text-zinc-500 max-md:mt-10 max-md:ml-2.5">
                          Solve some very cool AI generated connect four puzzles
                          to increase your rating.. and ego.
                        </div>
                      </div>
                    </div>
                    <div className="ml-5 w-6/12 max-md:ml-0 max-md:w-full">
                      <div className="flex flex-col items-center w-full bg-blue-800 aspect-square rounded-[37px] max-md:mt-10">
                        <div className="flex overflow-hidden flex-col px-8 py-12 max-md:px-5">
                          {/* Smaller Connect 4 Board Visual */}
                          {Array.from({ length: 6 }, (_, row) => (
                            <div
                              key={row}
                              className={`flex gap-3 justify-center ${row === 0 ? "mt-0" : "mt-4"}`}
                            >
                              {Array.from({ length: 7 }, (_, col) => (
                                <div key={col} className="w-9">
                                  <div className="flex shrink-0 w-full h-9 bg-blue-700 rounded-full fill-blue-700" />
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Watch Live Section */}
                <div className="flex flex-col items-center px-20 py-12 mt-14 w-full bg-gray-700 rounded-[60px] max-md:px-5 max-md:mt-10 max-md:mr-0.5 max-md:max-w-full">
                  <div className="text-5xl font-semibold tracking-tighter text-white max-md:text-4xl">
                    Watch Live
                  </div>
                  <div className="self-stretch mt-28 max-md:mt-10 max-md:max-w-full">
                    <div className="flex gap-5 max-md:flex-col">
                      <div className="w-6/12 max-md:ml-0 max-md:w-full">
                        <div className="flex flex-col items-center w-full bg-blue-800 aspect-square rounded-[37px] max-md:mt-10">
                          <div className="flex overflow-hidden flex-col px-8 py-12 max-md:px-5">
                            {/* Smaller Connect 4 Board Visual */}
                            {Array.from({ length: 6 }, (_, row) => (
                              <div
                                key={row}
                                className={`flex gap-2 justify-center ${row === 0 ? "mt-0" : "mt-4"}`}
                              >
                                {Array.from({ length: 7 }, (_, col) => (
                                  <div key={col} className="w-[25px]">
                                    <div className="flex shrink-0 w-full bg-blue-700 rounded-full fill-blue-700 h-[25px]" />
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="ml-5 w-6/12 max-md:ml-0 max-md:w-full">
                        <div className="flex flex-col items-center w-full bg-blue-800 aspect-square rounded-[37px] max-md:mt-10">
                          <div className="flex overflow-hidden flex-col px-8 py-12 max-md:px-5">
                            {/* Smaller Connect 4 Board Visual */}
                            {Array.from({ length: 6 }, (_, row) => (
                              <div
                                key={row}
                                className={`flex gap-2 justify-center ${row === 0 ? "mt-0" : "mt-4"}`}
                              >
                                {Array.from({ length: 7 }, (_, col) => (
                                  <div key={col} className="w-[25px]">
                                    <div className="flex shrink-0 w-full bg-blue-700 rounded-full fill-blue-700 h-[25px]" />
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Link
                    href="/admin/live-games"
                    className="flex flex-col justify-center px-9 py-8 mt-12 max-w-full text-2xl font-semibold tracking-tight text-white rounded-3xl bg-slate-600 w-[279px] max-md:px-5 max-md:mt-10 hover:bg-slate-500 transition-colors"
                  >
                    <div>See Current games</div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Learn Connect 4 Section */}
      <div className="flex flex-col justify-center self-end px-14 py-32 mt-14 mr-36 max-w-full bg-gray-700 rounded-[60px] w-[941px] max-md:px-5 max-md:py-24 max-md:mt-10 max-md:mr-2.5">
        <div className="mb-0 max-md:mb-2.5 max-md:max-w-full">
          <div className="flex gap-5 max-md:flex-col">
            <div className="w-[54%] max-md:ml-0 max-md:w-full">
              <div className="w-full bg-blue-800 rounded-[37px] max-md:mt-10 max-md:max-w-full">
                <div className="flex overflow-hidden flex-col px-8 py-14 max-md:px-5 max-md:max-w-full">
                  {/* Medium Connect 4 Board Visual */}
                  {Array.from({ length: 6 }, (_, row) => (
                    <div
                      key={row}
                      className={`flex gap-3 justify-center ${row === 0 ? "mt-0" : "mt-5"}`}
                    >
                      {Array.from({ length: 7 }, (_, col) => (
                        <div key={col} className="w-[41px]">
                          <div className="flex shrink-0 w-full bg-blue-700 rounded-full fill-blue-700 h-[41px]" />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="ml-5 w-[46%] max-md:ml-0 max-md:w-full">
              <div className="flex flex-col mt-14 w-full text-white max-md:mt-10">
                <div className="text-5xl font-semibold tracking-tighter max-md:text-4xl">
                  Learn Connect 4
                </div>
                <Link
                  href="/about-us"
                  className="flex gap-2 items-center self-start px-8 py-5 mt-14 ml-3 text-2xl font-medium text-center shadow-sm bg-slate-600 min-h-[74px] rounded-[30px] max-md:px-5 max-md:mt-10 max-md:ml-2.5 hover:bg-slate-500 transition-colors"
                >
                  <div className="flex-1 shrink self-stretch my-auto basis-0">
                    Learn Connect 4
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex overflow-hidden flex-col items-end px-16 pb-3 mt-20 w-full bg-gray-600 max-md:px-5 max-md:mt-10 max-md:max-w-full">
        <div className="flex flex-wrap gap-5 justify-between items-start w-full max-w-[1010px] max-md:max-w-full">
          <div className="flex gap-6 items-start text-base font-medium text-white whitespace-nowrap">
            <Link
              href="/about-us"
              className="hover:text-blue-300 transition-colors"
            >
              About
            </Link>
            <Link
              href="/events"
              className="hover:text-blue-300 transition-colors"
            >
              Events
            </Link>
          </div>
          <div className="flex flex-col self-stretch">
            <div className="flex gap-6 items-center self-end text-base font-medium text-white max-md:mr-2.5">
              <Link
                href="/privacy"
                className="self-stretch my-auto hover:text-blue-300 transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/privacy"
                className="self-stretch my-auto hover:text-blue-300 transition-colors"
              >
                Privacy Policy
              </Link>
              <div className="self-stretch my-auto">Privacy Settings</div>
            </div>
            <div className="flex gap-4 justify-center items-start mt-2.5 h-[41px]">
              <img
                src="/globe.svg"
                alt="Social Icon"
                className="object-contain shrink-0 aspect-square w-[46px]"
              />
              <img
                src="/globe.svg"
                alt="Social Icon"
                className="object-contain shrink-0 aspect-square w-[46px]"
              />
              <img
                src="/globe.svg"
                alt="Social Icon"
                className="object-contain shrink-0 rounded aspect-square w-[52px]"
              />
              <img
                src="/globe.svg"
                alt="Social Icon"
                className="object-contain shrink-0 rounded aspect-[0.93] w-[43px]"
              />
              <img
                src="/globe.svg"
                alt="Social Icon"
                className="object-contain shrink-0 aspect-[0.87] w-[41px]"
              />
              <img
                src="/globe.svg"
                alt="Social Icon"
                className="object-contain shrink-0 rounded aspect-[1.26] w-[58px]"
              />
            </div>
          </div>
          <div className="flex flex-col text-white">
            <div className="flex gap-6 items-center text-base font-medium">
              <Link
                href="/tools"
                className="self-stretch my-auto hover:text-blue-300 transition-colors"
              >
                Tools
              </Link>
              <div className="self-stretch my-auto">Partners</div>
              <div className="self-stretch my-auto">Fair Play</div>
            </div>
            <div className="self-center mt-5 text-2xl text-center">Con4.UK</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
