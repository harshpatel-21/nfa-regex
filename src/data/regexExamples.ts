export interface RegexExample {
  name: string;
  description: string;
  regex: string;
}

export const regexExamples: RegexExample[] = [
  {
    name: "Single symbol",
    description: 'Matches exactly "a"',
    regex: "a",
  },
  {
    name: "Union",
    description: 'Matches "a" or "b"',
    regex: "a+b",
  },
  {
    name: "Concatenation",
    description: 'Matches exactly "ab"',
    regex: "ab",
  },
  {
    name: "Kleene star",
    description: 'Zero or more "a"s',
    regex: "a*",
  },
  {
    name: "Concat + star",
    description: '"a" then zero or more "b"s then "c"',
    regex: "ab*c",
  },
  {
    name: "Grouped union + star",
    description: "Any string over {a, b}",
    regex: "(a+b)*",
  },
  {
    name: "Optional prefix",
    description: 'Optional "a" followed by zero or more "b"s',
    regex: "(a+ε)b*",
  },
  {
    name: "Alternating words",
    description: 'Repetitions of "ab" or "cd"',
    regex: "(ab+cd)*",
  },
  {
    name: 'Ends in "abb"',
    description: 'Classic NFA example — strings over {a,b} ending in "abb"',
    regex: "(a+b)*abb",
  },
  {
    name: 'Binary ends in "00"',
    description: "Binary strings ending in two zeros",
    regex: "(0+1)*00",
  },
  {
    name: "Sandwiched middle",
    description: '"a", then any mix of "b"s and "c"s, then "d"',
    regex: "a(b+c)*d",
  },
  {
    name: 'Third-from-last is "a"',
    description: 'Strings over {a,b} where the third-to-last character is "a"',
    regex: "(a+b)*a(a+b)(a+b)",
  },
];
