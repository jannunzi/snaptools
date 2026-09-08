export type CivicsQuestion = {
  num: number;
  question: string;
  answers: string[];
  need: number;
  starred: boolean;
  variable: boolean;
  officeholder: boolean;
  section: string;
};

/** Official 2025 USCIS civics bank (M-1778). Public domain U.S. government work. */
export const USCIS_CIVICS_SOURCE =
  "https://www.uscis.gov/sites/default/files/document/questions-and-answers/2025-Civics-Test-128-Questions-and-Answers.pdf";

export const USCIS_TEST_UPDATES = "https://www.uscis.gov/citizenship/testupdates";

export const USCIS_CIVICS_PAGE =
  "https://www.uscis.gov/citizenship-resource-center/naturalization-test-and-study-resources/2025-civics-test";

export const civicsQuestions: CivicsQuestion[] = [
  {
    num: 1,
    question: "What is the form of government of the United States?",
    answers: [
      "Republic",
      "Constitution-based federal republic",
      "Representative democracy"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · Principles"
  },
  {
    num: 2,
    question: "What is the supreme law of the land?",
    answers: [
      "(U.S.) Constitution"
    ],
    need: 1,
    starred: true,
    variable: false,
    officeholder: false,
    section: "American Government · Principles"
  },
  {
    num: 3,
    question: "Name one thing the U.S. Constitution does.",
    answers: [
      "Forms the government",
      "Defines powers of government",
      "Defines the parts of government",
      "Protects the rights of the people"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · Principles"
  },
  {
    num: 4,
    question: "The U.S. Constitution starts with the words \"We the People.\" What does \"We the People\" mean?",
    answers: [
      "Self-government",
      "Popular sovereignty",
      "Consent of the governed",
      "People should govern themselves",
      "(Example of) social contract"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · Principles"
  },
  {
    num: 5,
    question: "How are changes made to the U.S. Constitution?",
    answers: [
      "Amendments",
      "The amendment process"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · Principles"
  },
  {
    num: 6,
    question: "What does the Bill of Rights protect?",
    answers: [
      "(The basic) rights of Americans",
      "(The basic) rights of people living in the United States"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · Principles"
  },
  {
    num: 7,
    question: "How many amendments does the U.S. Constitution have?",
    answers: [
      "Twenty-seven (27)"
    ],
    need: 1,
    starred: true,
    variable: false,
    officeholder: false,
    section: "American Government · Principles"
  },
  {
    num: 8,
    question: "Why is the Declaration of Independence important?",
    answers: [
      "It says America is free from British control.",
      "It says all people are created equal.",
      "It identifies inherent rights.",
      "It identifies individual freedoms."
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · Principles"
  },
  {
    num: 9,
    question: "What founding document said the American colonies were free from Britain?",
    answers: [
      "Declaration of Independence"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · Principles"
  },
  {
    num: 10,
    question: "Name two important ideas from the Declaration of Independence and the U.S. Constitution.",
    answers: [
      "Equality",
      "Liberty",
      "Social contract",
      "Natural rights",
      "Limited government",
      "Self-government"
    ],
    need: 2,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · Principles"
  },
  {
    num: 11,
    question: "The words \"Life, Liberty, and the pursuit of Happiness\" are in what founding document?",
    answers: [
      "Declaration of Independence"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · Principles"
  },
  {
    num: 12,
    question: "What is the economic system of the United States?",
    answers: [
      "Capitalism",
      "Free market economy"
    ],
    need: 1,
    starred: true,
    variable: false,
    officeholder: false,
    section: "American Government · Principles"
  },
  {
    num: 13,
    question: "What is the rule of law?",
    answers: [
      "Everyone must follow the law.",
      "Leaders must obey the law.",
      "Government must obey the law.",
      "No one is above the law."
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · Principles"
  },
  {
    num: 14,
    question: "Many documents influenced the U.S. Constitution. Name one.",
    answers: [
      "Declaration of Independence",
      "Articles of Confederation",
      "Federalist Papers",
      "Anti-Federalist Papers",
      "Virginia Declaration of Rights",
      "Fundamental Orders of Connecticut",
      "Mayflower Compact",
      "Iroquois Great Law of Peace"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · Principles"
  },
  {
    num: 15,
    question: "There are three branches of government. Why?",
    answers: [
      "So one part does not become too powerful",
      "Checks and balances",
      "Separation of powers"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · Principles"
  },
  {
    num: 16,
    question: "Name the three branches of government.",
    answers: [
      "Legislative, executive, and judicial",
      "Congress, president, and the courts"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · System of Government"
  },
  {
    num: 17,
    question: "The President of the United States is in charge of which branch of government?",
    answers: [
      "Executive branch"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · System of Government"
  },
  {
    num: 18,
    question: "What part of the federal government writes laws?",
    answers: [
      "(U.S.) Congress",
      "(U.S. or national) legislature",
      "Legislative branch"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · System of Government"
  },
  {
    num: 19,
    question: "What are the two parts of the U.S. Congress?",
    answers: [
      "Senate and House (of Representatives)"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · System of Government"
  },
  {
    num: 20,
    question: "Name one power of the U.S. Congress.",
    answers: [
      "Writes laws",
      "Declares war",
      "Makes the federal budget"
    ],
    need: 1,
    starred: true,
    variable: false,
    officeholder: false,
    section: "American Government · System of Government"
  },
  {
    num: 21,
    question: "How many U.S. senators are there?",
    answers: [
      "One hundred (100)"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · System of Government"
  },
  {
    num: 22,
    question: "How long is a term for a U.S. senator?",
    answers: [
      "Six (6) years"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · System of Government"
  },
  {
    num: 23,
    question: "Who is one of your state's U.S. senators now?",
    answers: [
      "Answers will vary.",
      "District of Columbia residents and residents of U.S. territories should answer that D.C. (or the territory where the applicant lives) has no U.S. senators."
    ],
    need: 1,
    starred: false,
    variable: true,
    officeholder: false,
    section: "American Government · System of Government"
  },
  {
    num: 24,
    question: "How many voting members are in the House of Representatives?",
    answers: [
      "Four hundred thirty-five (435)"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · System of Government"
  },
  {
    num: 25,
    question: "How long is a term for a member of the House of Representatives?",
    answers: [
      "Two (2) years"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · System of Government"
  },
  {
    num: 26,
    question: "Why do U.S. representatives serve shorter terms than U.S. senators?",
    answers: [
      "To more closely follow public opinion"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · System of Government"
  },
  {
    num: 27,
    question: "How many senators does each state have?",
    answers: [
      "Two (2)"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · System of Government"
  },
  {
    num: 28,
    question: "Why does each state have two senators?",
    answers: [
      "Equal representation (for small states)",
      "The Great Compromise (Connecticut Compromise)"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · System of Government"
  },
  {
    num: 29,
    question: "Name your U.S. representative.",
    answers: [
      "Answers will vary.",
      "Residents of territories with nonvoting Delegates or Resident Commissioners may provide the name of that Delegate or Commissioner.",
      "Also acceptable is any statement that the territory has no (voting) representatives in Congress."
    ],
    need: 1,
    starred: false,
    variable: true,
    officeholder: false,
    section: "American Government · System of Government"
  },
  {
    num: 30,
    question: "What is the name of the Speaker of the House of Representatives now?",
    answers: [
      "Mike Johnson"
    ],
    need: 1,
    starred: true,
    variable: false,
    officeholder: true,
    section: "American Government · System of Government"
  },
  {
    num: 31,
    question: "Who does a U.S. senator represent?",
    answers: [
      "Citizens of their state",
      "People of their state"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · System of Government"
  },
  {
    num: 32,
    question: "Who elects U.S. senators?",
    answers: [
      "Citizens from their state"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · System of Government"
  },
  {
    num: 33,
    question: "Who does a member of the House of Representatives represent?",
    answers: [
      "Citizens in their (congressional) district",
      "People from their (congressional) district"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · System of Government"
  },
  {
    num: 34,
    question: "Who elects members of the House of Representatives?",
    answers: [
      "Citizens from their (congressional) district"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · System of Government"
  },
  {
    num: 35,
    question: "Some states have more representatives than other states. Why?",
    answers: [
      "(Because of) the state's population",
      "(Because) they have more people",
      "(Because) some states have more people"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · System of Government"
  },
  {
    num: 36,
    question: "The President of the United States is elected for how many years?",
    answers: [
      "Four (4) years"
    ],
    need: 1,
    starred: true,
    variable: false,
    officeholder: false,
    section: "American Government · System of Government"
  },
  {
    num: 37,
    question: "The President of the United States can serve only two terms. Why?",
    answers: [
      "(Because of) the 22nd Amendment",
      "To keep the president from becoming too powerful"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · System of Government"
  },
  {
    num: 38,
    question: "What is the name of the President of the United States now?",
    answers: [
      "Donald Trump"
    ],
    need: 1,
    starred: true,
    variable: false,
    officeholder: true,
    section: "American Government · System of Government"
  },
  {
    num: 39,
    question: "What is the name of the Vice President of the United States now?",
    answers: [
      "JD Vance"
    ],
    need: 1,
    starred: true,
    variable: false,
    officeholder: true,
    section: "American Government · System of Government"
  },
  {
    num: 40,
    question: "If the president can no longer serve, who becomes president?",
    answers: [
      "The Vice President (of the United States)"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · System of Government"
  },
  {
    num: 41,
    question: "Name one power of the president.",
    answers: [
      "Signs bills into law",
      "Vetoes bills",
      "Enforces laws",
      "Commander in Chief (of the military)",
      "Chief diplomat",
      "Appoints federal judges"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · System of Government"
  },
  {
    num: 42,
    question: "Who is Commander in Chief of the U.S. military?",
    answers: [
      "The President (of the United States)"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · System of Government"
  },
  {
    num: 43,
    question: "Who signs bills to become laws?",
    answers: [
      "The President (of the United States)"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · System of Government"
  },
  {
    num: 44,
    question: "Who vetoes bills?",
    answers: [
      "The President (of the United States)"
    ],
    need: 1,
    starred: true,
    variable: false,
    officeholder: false,
    section: "American Government · System of Government"
  },
  {
    num: 45,
    question: "Who appoints federal judges?",
    answers: [
      "The President (of the United States)"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · System of Government"
  },
  {
    num: 46,
    question: "The executive branch has many parts. Name one.",
    answers: [
      "President (of the United States)",
      "Cabinet",
      "Federal departments and agencies"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · System of Government"
  },
  {
    num: 47,
    question: "What does the President's Cabinet do?",
    answers: [
      "Advises the President (of the United States)"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · System of Government"
  },
  {
    num: 48,
    question: "What are two Cabinet-level positions?",
    answers: [
      "Attorney General",
      "Secretary of Agriculture",
      "Secretary of Commerce",
      "Secretary of Education",
      "Secretary of Energy",
      "Secretary of Health and Human Services",
      "Secretary of Homeland Security",
      "Secretary of Housing and Urban Development",
      "Secretary of the Interior",
      "Secretary of Labor",
      "Secretary of State",
      "Secretary of Transportation",
      "Secretary of the Treasury",
      "Secretary of Veterans Affairs",
      "Secretary of War (Defense)",
      "Vice-President",
      "Administrator of the Environmental Protection Agency",
      "Administrator of the Small Business Administration",
      "Director of the Central Intelligence Agency",
      "Director of the Office of Management and Budget",
      "Director of National Intelligence",
      "United States Trade Representative"
    ],
    need: 2,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · System of Government"
  },
  {
    num: 49,
    question: "Why is the Electoral College important?",
    answers: [
      "It decides who is elected president.",
      "It provides a compromise between the popular election of the president and congressional selection."
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · System of Government"
  },
  {
    num: 50,
    question: "What is one part of the judicial branch?",
    answers: [
      "Supreme Court",
      "Federal Courts"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · System of Government"
  },
  {
    num: 51,
    question: "What does the judicial branch do?",
    answers: [
      "Reviews laws",
      "Explains laws",
      "Resolves disputes (disagreements) about the law",
      "Decides if a law goes against the (U.S.) Constitution"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · System of Government"
  },
  {
    num: 52,
    question: "What is the highest court in the United States?",
    answers: [
      "Supreme Court"
    ],
    need: 1,
    starred: true,
    variable: false,
    officeholder: false,
    section: "American Government · System of Government"
  },
  {
    num: 53,
    question: "How many seats are on the Supreme Court?",
    answers: [
      "Nine (9)"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · System of Government"
  },
  {
    num: 54,
    question: "How many Supreme Court justices are usually needed to decide a case?",
    answers: [
      "Five (5)"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · System of Government"
  },
  {
    num: 55,
    question: "How long do Supreme Court justices serve?",
    answers: [
      "(For) life",
      "Lifetime appointment",
      "(Until) retirement"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · System of Government"
  },
  {
    num: 56,
    question: "Supreme Court justices serve for life. Why?",
    answers: [
      "To be independent (of politics)",
      "To limit outside (political) influence"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · System of Government"
  },
  {
    num: 57,
    question: "Who is the Chief Justice of the United States now?",
    answers: [
      "John Roberts"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: true,
    section: "American Government · System of Government"
  },
  {
    num: 58,
    question: "Name one power that is only for the federal government.",
    answers: [
      "Print paper money",
      "Mint coins",
      "Declare war",
      "Create an army",
      "Make treaties",
      "Set foreign policy"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · System of Government"
  },
  {
    num: 59,
    question: "Name one power that is only for the states.",
    answers: [
      "Provide schooling and education",
      "Provide protection (police)",
      "Provide safety (fire departments)",
      "Give a driver's license",
      "Approve zoning and land use"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · System of Government"
  },
  {
    num: 60,
    question: "What is the purpose of the 10th Amendment?",
    answers: [
      "(It states that the) powers not given to the federal government belong to the states or to the people."
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · System of Government"
  },
  {
    num: 61,
    question: "Who is the governor of your state now?",
    answers: [
      "Answers will vary.",
      "District of Columbia residents should answer that D.C. does not have a governor."
    ],
    need: 1,
    starred: true,
    variable: true,
    officeholder: false,
    section: "American Government · System of Government"
  },
  {
    num: 62,
    question: "What is the capital of your state?",
    answers: [
      "Answers will vary.",
      "District of Columbia residents should answer that D.C. is not a state and does not have a capital.",
      "Residents of U.S. territories should name the capital of the territory."
    ],
    need: 1,
    starred: false,
    variable: true,
    officeholder: false,
    section: "American Government · System of Government"
  },
  {
    num: 63,
    question: "There are four amendments to the U.S. Constitution about who can vote. Describe one of them.",
    answers: [
      "Citizens eighteen (18) and older (can vote).",
      "You don't have to pay (a poll tax) to vote.",
      "Any citizen can vote. (Women and men can vote.)",
      "A male citizen of any race (can vote)."
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · Rights and Responsibilities"
  },
  {
    num: 64,
    question: "Who can vote in federal elections, run for federal office, and serve on a jury in the United States?",
    answers: [
      "Citizens",
      "Citizens of the United States",
      "U.S. citizens"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · Rights and Responsibilities"
  },
  {
    num: 65,
    question: "What are three rights of everyone living in the United States?",
    answers: [
      "Freedom of expression",
      "Freedom of speech",
      "Freedom of assembly",
      "Freedom to petition the government",
      "Freedom of religion",
      "The right to bear arms"
    ],
    need: 3,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · Rights and Responsibilities"
  },
  {
    num: 66,
    question: "What do we show loyalty to when we say the Pledge of Allegiance?",
    answers: [
      "The United States",
      "The flag"
    ],
    need: 1,
    starred: true,
    variable: false,
    officeholder: false,
    section: "American Government · Rights and Responsibilities"
  },
  {
    num: 67,
    question: "Name two promises that new citizens make in the Oath of Allegiance.",
    answers: [
      "Give up loyalty to other countries",
      "Defend the (U.S.) Constitution",
      "Obey the laws of the United States",
      "Serve in the military (if needed)",
      "Serve (help, do important work for) the nation (if needed)",
      "Be loyal to the United States"
    ],
    need: 2,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · Rights and Responsibilities"
  },
  {
    num: 68,
    question: "How can people become United States citizens?",
    answers: [
      "Be born in the United States, under the conditions set by the 14th Amendment",
      "Naturalize",
      "Derive citizenship (under conditions set by Congress)"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · Rights and Responsibilities"
  },
  {
    num: 69,
    question: "What are two examples of civic participation in the United States?",
    answers: [
      "Vote",
      "Run for office",
      "Join a political party",
      "Help with a campaign",
      "Join a civic group",
      "Join a community group",
      "Give an elected official your opinion (on an issue)",
      "Contact elected officials",
      "Support or oppose an issue or policy",
      "Write to a newspaper"
    ],
    need: 2,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · Rights and Responsibilities"
  },
  {
    num: 70,
    question: "What is one way Americans can serve their country?",
    answers: [
      "Vote",
      "Pay taxes",
      "Obey the law",
      "Serve in the military",
      "Run for office",
      "Work for local, state, or federal government"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · Rights and Responsibilities"
  },
  {
    num: 71,
    question: "Why is it important to pay federal taxes?",
    answers: [
      "Required by law",
      "All people pay to fund the federal government",
      "Required by the (U.S.) Constitution (16th Amendment)",
      "Civic duty"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · Rights and Responsibilities"
  },
  {
    num: 72,
    question: "It is important for all men age 18 through 25 to register for the Selective Service. Name one reason why.",
    answers: [
      "Required by law",
      "Civic duty",
      "Makes the draft fair, if needed"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American Government · Rights and Responsibilities"
  },
  {
    num: 73,
    question: "The colonists came to America for many reasons. Name one.",
    answers: [
      "Freedom",
      "Political liberty",
      "Religious freedom",
      "Economic opportunity",
      "Escape persecution"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American History · Colonial Period and Independence"
  },
  {
    num: 74,
    question: "Who lived in America before the Europeans arrived?",
    answers: [
      "American Indians",
      "Native Americans"
    ],
    need: 1,
    starred: true,
    variable: false,
    officeholder: false,
    section: "American History · Colonial Period and Independence"
  },
  {
    num: 75,
    question: "What group of people was taken and sold as slaves?",
    answers: [
      "Africans",
      "People from Africa"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American History · Colonial Period and Independence"
  },
  {
    num: 76,
    question: "What war did the Americans fight to win independence from Britain?",
    answers: [
      "American Revolution",
      "The (American) Revolutionary War",
      "War for (American) Independence"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American History · Colonial Period and Independence"
  },
  {
    num: 77,
    question: "Name one reason why the Americans declared independence from Britain.",
    answers: [
      "High taxes",
      "Taxation without representation",
      "British soldiers stayed in Americans' houses (boarding, quartering)",
      "They did not have self-government",
      "Boston Massacre",
      "Boston Tea Party (Tea Act)",
      "Stamp Act",
      "Sugar Act",
      "Townshend Acts",
      "Intolerable (Coercive) Acts"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American History · Colonial Period and Independence"
  },
  {
    num: 78,
    question: "Who wrote the Declaration of Independence?",
    answers: [
      "(Thomas) Jefferson"
    ],
    need: 1,
    starred: true,
    variable: false,
    officeholder: false,
    section: "American History · Colonial Period and Independence"
  },
  {
    num: 79,
    question: "When was the Declaration of Independence adopted?",
    answers: [
      "July 4, 1776"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American History · Colonial Period and Independence"
  },
  {
    num: 80,
    question: "The American Revolution had many important events. Name one.",
    answers: [
      "(Battle of) Bunker Hill",
      "Declaration of Independence",
      "Washington Crossing the Delaware (Battle of Trenton)",
      "(Battle of) Saratoga",
      "Valley Forge (Encampment)",
      "(Battle of) Yorktown (British surrender at Yorktown)"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American History · Colonial Period and Independence"
  },
  {
    num: 81,
    question: "There were 13 original states. Name five.",
    answers: [
      "New Hampshire",
      "Massachusetts",
      "Rhode Island",
      "Connecticut",
      "New York",
      "New Jersey",
      "Pennsylvania",
      "Delaware",
      "Maryland",
      "Virginia",
      "North Carolina",
      "South Carolina",
      "Georgia"
    ],
    need: 5,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American History · Colonial Period and Independence"
  },
  {
    num: 82,
    question: "What founding document was written in 1787?",
    answers: [
      "(U.S.) Constitution"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American History · Colonial Period and Independence"
  },
  {
    num: 83,
    question: "The Federalist Papers supported the passage of the U.S. Constitution. Name one of the writers.",
    answers: [
      "(James) Madison",
      "(Alexander) Hamilton",
      "(John) Jay",
      "Publius"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American History · Colonial Period and Independence"
  },
  {
    num: 84,
    question: "Why were the Federalist Papers important?",
    answers: [
      "They helped people understand the (U.S.) Constitution.",
      "They supported passing the (U.S.) Constitution."
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American History · Colonial Period and Independence"
  },
  {
    num: 85,
    question: "Benjamin Franklin is famous for many things. Name one.",
    answers: [
      "Founded the first free public libraries",
      "First Postmaster General of the United States",
      "Helped write the Declaration of Independence",
      "Inventor",
      "U.S. diplomat"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American History · Colonial Period and Independence"
  },
  {
    num: 86,
    question: "George Washington is famous for many things. Name one.",
    answers: [
      "“Father of Our Country”",
      "First president of the United States",
      "General of the Continental Army",
      "President of the Constitutional Convention"
    ],
    need: 1,
    starred: true,
    variable: false,
    officeholder: false,
    section: "American History · Colonial Period and Independence"
  },
  {
    num: 87,
    question: "Thomas Jefferson is famous for many things. Name one.",
    answers: [
      "Writer of the Declaration of Independence",
      "Third president of the United States",
      "Doubled the size of the United States (Louisiana Purchase)",
      "First Secretary of State",
      "Founded the University of Virginia",
      "Writer of the Virginia Statute on Religious Freedom"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American History · Colonial Period and Independence"
  },
  {
    num: 88,
    question: "James Madison is famous for many things. Name one.",
    answers: [
      "“Father of the Constitution”",
      "Fourth president of the United States",
      "President during the War of 1812",
      "One of the writers of the Federalist Papers"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American History · Colonial Period and Independence"
  },
  {
    num: 89,
    question: "Alexander Hamilton is famous for many things. Name one.",
    answers: [
      "First Secretary of the Treasury",
      "One of the writers of the Federalist Papers",
      "Helped establish the First Bank of the United States",
      "Aide to General George Washington",
      "Member of the Continental Congress"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American History · Colonial Period and Independence"
  },
  {
    num: 90,
    question: "What territory did the United States buy from France in 1803?",
    answers: [
      "Louisiana Territory",
      "Louisiana"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American History · 1800s"
  },
  {
    num: 91,
    question: "Name one war fought by the United States in the 1800s.",
    answers: [
      "War of 1812",
      "Mexican-American War",
      "Civil War",
      "Spanish-American War"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American History · 1800s"
  },
  {
    num: 92,
    question: "Name the U.S. war between the North and the South.",
    answers: [
      "The Civil War"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American History · 1800s"
  },
  {
    num: 93,
    question: "The Civil War had many important events. Name one.",
    answers: [
      "(Battle of) Fort Sumter",
      "Emancipation Proclamation",
      "(Battle of) Vicksburg",
      "(Battle of) Gettysburg",
      "Sherman's March",
      "(Surrender at) Appomattox",
      "(Battle of) Antietam/Sharpsburg",
      "Lincoln was assassinated."
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American History · 1800s"
  },
  {
    num: 94,
    question: "Abraham Lincoln is famous for many things. Name one.",
    answers: [
      "Freed the slaves (Emancipation Proclamation)",
      "Saved (or preserved) the Union",
      "Led the United States during the Civil War",
      "16th president of the United States",
      "Delivered the Gettysburg Address"
    ],
    need: 1,
    starred: true,
    variable: false,
    officeholder: false,
    section: "American History · 1800s"
  },
  {
    num: 95,
    question: "What did the Emancipation Proclamation do?",
    answers: [
      "Freed the slaves",
      "Freed slaves in the Confederacy",
      "Freed slaves in the Confederate states",
      "Freed slaves in most Southern states"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American History · 1800s"
  },
  {
    num: 96,
    question: "What U.S. war ended slavery?",
    answers: [
      "The Civil War"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American History · 1800s"
  },
  {
    num: 97,
    question: "What amendment says all persons born or naturalized in the United States, and subject to the jurisdiction thereof, are U.S. citizens?",
    answers: [
      "14th Amendment"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American History · 1800s"
  },
  {
    num: 98,
    question: "When did all men get the right to vote?",
    answers: [
      "After the Civil War",
      "During Reconstruction",
      "(With the) 15th Amendment",
      "1870"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American History · 1800s"
  },
  {
    num: 99,
    question: "Name one leader of the women's rights movement in the 1800s.",
    answers: [
      "Susan B. Anthony",
      "Elizabeth Cady Stanton",
      "Sojourner Truth",
      "Harriet Tubman",
      "Lucretia Mott",
      "Lucy Stone"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American History · 1800s"
  },
  {
    num: 100,
    question: "Name one war fought by the United States in the 1900s.",
    answers: [
      "World War I",
      "World War II",
      "Korean War",
      "Vietnam War",
      "(Persian) Gulf War"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American History · Recent History"
  },
  {
    num: 101,
    question: "Why did the United States enter World War I?",
    answers: [
      "Because Germany attacked U.S. (civilian) ships",
      "To support the Allied Powers (England, France, Italy, and Russia)",
      "To oppose the Central Powers (Germany, Austria-Hungary, the Ottoman Empire, and Bulgaria)"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American History · Recent History"
  },
  {
    num: 102,
    question: "When did all women get the right to vote?",
    answers: [
      "1920",
      "After World War I",
      "(With the) 19th Amendment"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American History · Recent History"
  },
  {
    num: 103,
    question: "What was the Great Depression?",
    answers: [
      "Longest economic recession in modern history"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American History · Recent History"
  },
  {
    num: 104,
    question: "When did the Great Depression start?",
    answers: [
      "The Great Crash (1929)",
      "Stock market crash of 1929"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American History · Recent History"
  },
  {
    num: 105,
    question: "Who was president during the Great Depression and World War II?",
    answers: [
      "(Franklin) Roosevelt"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American History · Recent History"
  },
  {
    num: 106,
    question: "Why did the United States enter World War II?",
    answers: [
      "(Bombing of) Pearl Harbor",
      "Japanese attacked Pearl Harbor",
      "To support the Allied Powers (England, France, and Russia)",
      "To oppose the Axis Powers (Germany, Italy, and Japan)"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American History · Recent History"
  },
  {
    num: 107,
    question: "Dwight Eisenhower is famous for many things. Name one.",
    answers: [
      "General during World War II",
      "President at the end of (during) the Korean War",
      "34th president of the United States",
      "Signed the Federal-Aid Highway Act of 1956 (Created the Interstate System)"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American History · Recent History"
  },
  {
    num: 108,
    question: "Who was the United States' main rival during the Cold War?",
    answers: [
      "Soviet Union",
      "USSR",
      "Russia"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American History · Recent History"
  },
  {
    num: 109,
    question: "During the Cold War, what was one main concern of the United States?",
    answers: [
      "Communism",
      "Nuclear war"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American History · Recent History"
  },
  {
    num: 110,
    question: "Why did the United States enter the Korean War?",
    answers: [
      "To stop the spread of communism"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American History · Recent History"
  },
  {
    num: 111,
    question: "Why did the United States enter the Vietnam War?",
    answers: [
      "To stop the spread of communism"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American History · Recent History"
  },
  {
    num: 112,
    question: "What did the civil rights movement do?",
    answers: [
      "Fought to end racial discrimination"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American History · Recent History"
  },
  {
    num: 113,
    question: "Martin Luther King, Jr. is famous for many things. Name one.",
    answers: [
      "Fought for civil rights",
      "Worked for equality for all Americans",
      "Worked to ensure that people would “not be judged by the color of their skin, but by the content of their character”"
    ],
    need: 1,
    starred: true,
    variable: false,
    officeholder: false,
    section: "American History · Recent History"
  },
  {
    num: 114,
    question: "Why did the United States enter the Persian Gulf War?",
    answers: [
      "To force the Iraqi military from Kuwait"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American History · Recent History"
  },
  {
    num: 115,
    question: "What major event happened on September 11, 2001 in the United States?",
    answers: [
      "Terrorists attacked the United States",
      "Terrorists took over two planes and crashed them into the World Trade Center in New York City",
      "Terrorists took over a plane and crashed into the Pentagon in Arlington, Virginia",
      "Terrorists took over a plane originally aimed at Washington, D.C., and crashed in a field in Pennsylvania"
    ],
    need: 1,
    starred: true,
    variable: false,
    officeholder: false,
    section: "American History · Recent History"
  },
  {
    num: 116,
    question: "Name one U.S. military conflict after the September 11, 2001 attacks.",
    answers: [
      "(Global) War on Terror",
      "War in Afghanistan",
      "War in Iraq"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American History · Recent History"
  },
  {
    num: 117,
    question: "Name one American Indian tribe in the United States.",
    answers: [
      "Apache",
      "Blackfeet",
      "Cayuga",
      "Cherokee",
      "Cheyenne",
      "Chippewa",
      "Choctaw",
      "Creek",
      "Crow",
      "Hopi",
      "Huron",
      "Inupiat",
      "Lakota",
      "Mohawk",
      "Mohegan",
      "Navajo",
      "Oneida",
      "Onondaga",
      "Pueblo",
      "Seminole",
      "Seneca",
      "Shawnee",
      "Sioux",
      "Teton",
      "Tuscarora"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American History · Recent History"
  },
  {
    num: 118,
    question: "Name one example of an American innovation.",
    answers: [
      "Light bulb",
      "Automobile (cars, internal combustion engine)",
      "Skyscrapers",
      "Airplane",
      "Assembly line",
      "Landing on the moon",
      "Integrated circuit (IC)"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "American History · Recent History"
  },
  {
    num: 119,
    question: "What is the capital of the United States?",
    answers: [
      "Washington, D.C."
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "Symbols and Holidays · Symbols"
  },
  {
    num: 120,
    question: "Where is the Statue of Liberty?",
    answers: [
      "New York (Harbor)",
      "Liberty Island",
      "New Jersey",
      "Near New York City",
      "On the Hudson (River)"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "Symbols and Holidays · Symbols"
  },
  {
    num: 121,
    question: "Why does the flag have 13 stripes?",
    answers: [
      "(Because there were) 13 original colonies",
      "(Because the stripes) represent the original colonies"
    ],
    need: 1,
    starred: true,
    variable: false,
    officeholder: false,
    section: "Symbols and Holidays · Symbols"
  },
  {
    num: 122,
    question: "Why does the flag have 50 stars?",
    answers: [
      "(Because there is) one star for each state",
      "(Because) each star represents a state",
      "(Because there are) 50 states"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "Symbols and Holidays · Symbols"
  },
  {
    num: 123,
    question: "What is the name of the national anthem?",
    answers: [
      "The Star-Spangled Banner"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "Symbols and Holidays · Symbols"
  },
  {
    num: 124,
    question: "The Nation's first motto was \"E Pluribus Unum.\" What does that mean?",
    answers: [
      "Out of many, one",
      "We all become one"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "Symbols and Holidays · Symbols"
  },
  {
    num: 125,
    question: "What is Independence Day?",
    answers: [
      "A holiday to celebrate U.S. independence (from Britain)",
      "The country's birthday"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "Symbols and Holidays · Holidays"
  },
  {
    num: 126,
    question: "Name three national U.S. holidays.",
    answers: [
      "New Year's Day",
      "Martin Luther King, Jr. Day",
      "Presidents Day (Washington's Birthday)",
      "Memorial Day",
      "Juneteenth",
      "Independence Day",
      "Labor Day",
      "Columbus Day",
      "Veterans Day",
      "Thanksgiving Day",
      "Christmas Day"
    ],
    need: 3,
    starred: true,
    variable: false,
    officeholder: false,
    section: "Symbols and Holidays · Holidays"
  },
  {
    num: 127,
    question: "What is Memorial Day?",
    answers: [
      "A holiday to honor soldiers who died in military service"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "Symbols and Holidays · Holidays"
  },
  {
    num: 128,
    question: "What is Veterans Day?",
    answers: [
      "A holiday to honor people in the (U.S.) military",
      "A holiday to honor people who have served (in the U.S. military)"
    ],
    need: 1,
    starred: false,
    variable: false,
    officeholder: false,
    section: "Symbols and Holidays · Holidays"
  }
];
