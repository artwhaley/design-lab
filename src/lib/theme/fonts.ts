export const FONT_STACKS: Record<string, string> = {
  georgia: "Georgia, 'Times New Roman', Times, serif",
  palatino: "Palatino, 'Palatino Linotype', 'Book Antiqua', Georgia, serif",
  tahoma: 'Tahoma, Verdana, Geneva, sans-serif',
  trebuchet: "'Trebuchet MS', Tahoma, Verdana, sans-serif",
  verdana: 'Verdana, Geneva, Tahoma, sans-serif',
  newsreader: "'Newsreader', Georgia, 'Times New Roman', serif",
  lato: "'Lato', Tahoma, Verdana, sans-serif",
}

export const resolveFontStack = (key: string): string => FONT_STACKS[key] ?? FONT_STACKS.verdana
