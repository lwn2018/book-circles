// PagePass Avatar Set — Illustrated butterflies and bees
// Design: Pen-and-ink style with watercolour wash
// Brand accent (antenna tips, wing membranes): #55B2DE

export type AvatarSlug = 'marigold' | 'azure' | 'blush' | 'honey' | 'rue' | 'bumble'

export type AvatarDefinition = {
  slug: AvatarSlug
  name: string
  description: string
  svg: string
}

export const AVATARS: AvatarDefinition[] = [
  {
    slug: 'marigold',
    name: 'Marigold',
    description: 'Monarch butterfly',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="50" fill="#F0EAE2"/>
  <path d="M48,42 Q36,18 13,17 Q3,28 7,47 Q17,60 48,53Z" fill="#E8820A" fill-opacity=".54" stroke="#1a0804" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M34,40 Q22,32 12,20" fill="none" stroke="#1a0804" stroke-width=".85" stroke-linecap="round" opacity=".38"/>
  <path d="M26,50 Q16,44 8,36" fill="none" stroke="#1a0804" stroke-width=".7" stroke-linecap="round" opacity=".3"/>
  <path d="M52,42 Q64,18 87,17 Q97,28 93,47 Q83,60 52,53Z" fill="#E8820A" fill-opacity=".54" stroke="#1a0804" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M66,40 Q78,32 88,20" fill="none" stroke="#1a0804" stroke-width=".85" stroke-linecap="round" opacity=".38"/>
  <path d="M74,50 Q84,44 92,36" fill="none" stroke="#1a0804" stroke-width=".7" stroke-linecap="round" opacity=".3"/>
  <path d="M48,53 Q26,57 14,74 Q10,85 24,90 Q40,92 48,70Z" fill="#C06808" fill-opacity=".48" stroke="#1a0804" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M52,53 Q74,57 86,74 Q90,85 76,90 Q60,92 52,70Z" fill="#C06808" fill-opacity=".48" stroke="#1a0804" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="9" cy="36" r="2.2" fill="white" stroke="#1a0804" stroke-width=".8"/>
  <circle cx="9" cy="27" r="1.6" fill="white" stroke="#1a0804" stroke-width=".7"/>
  <circle cx="91" cy="36" r="2.2" fill="white" stroke="#1a0804" stroke-width=".8"/>
  <circle cx="91" cy="27" r="1.6" fill="white" stroke="#1a0804" stroke-width=".7"/>
  <ellipse cx="50" cy="55" rx="2.3" ry="18" fill="#1a0804" fill-opacity=".9"/>
  <circle cx="50" cy="35" r="4.5" fill="#1a0804" fill-opacity=".88"/>
  <path d="M48,31 Q43,21 38,13" fill="none" stroke="#1a0804" stroke-width="1.4" stroke-linecap="round"/>
  <circle cx="38" cy="13" r="2.8" fill="#55B2DE" fill-opacity=".88" stroke="#1a0804" stroke-width=".9"/>
  <path d="M52,31 Q57,21 62,13" fill="none" stroke="#1a0804" stroke-width="1.4" stroke-linecap="round"/>
  <circle cx="62" cy="13" r="2.8" fill="#55B2DE" fill-opacity=".88" stroke="#1a0804" stroke-width=".9"/>
</svg>`
  },
  {
    slug: 'azure',
    name: 'Azure',
    description: 'Morpho butterfly',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="50" fill="#F0EAE2"/>
  <path d="M48,44 Q33,18 10,16 Q1,28 5,48 Q15,62 48,54Z" fill="#55B2DE" fill-opacity=".58" stroke="#0a2840" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M32,30 Q21,38 14,50" fill="none" stroke="#C8EEFF" stroke-width="2.5" stroke-linecap="round" opacity=".48"/>
  <path d="M36,44 Q24,36 12,23" fill="none" stroke="#0a2840" stroke-width=".85" stroke-linecap="round" opacity=".36"/>
  <path d="M52,44 Q67,18 90,16 Q99,28 95,48 Q85,62 52,54Z" fill="#55B2DE" fill-opacity=".58" stroke="#0a2840" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M68,30 Q79,38 86,50" fill="none" stroke="#C8EEFF" stroke-width="2.5" stroke-linecap="round" opacity=".48"/>
  <path d="M64,44 Q76,36 88,23" fill="none" stroke="#0a2840" stroke-width=".85" stroke-linecap="round" opacity=".36"/>
  <path d="M48,54 Q26,58 12,76 Q8,88 24,92 Q42,93 48,70Z" fill="#2A80B8" fill-opacity=".52" stroke="#0a2840" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M52,54 Q74,58 88,76 Q92,88 76,92 Q58,93 52,70Z" fill="#2A80B8" fill-opacity=".52" stroke="#0a2840" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
  <ellipse cx="50" cy="56" rx="2.3" ry="18" fill="#0a1820" fill-opacity=".9"/>
  <circle cx="50" cy="37" r="4.5" fill="#0a1820" fill-opacity=".88"/>
  <path d="M48,33 Q43,23 38,15" fill="none" stroke="#0a2840" stroke-width="1.4" stroke-linecap="round"/>
  <circle cx="38" cy="15" r="2.8" fill="#E8924A" fill-opacity=".88" stroke="#0a2840" stroke-width=".9"/>
  <path d="M52,33 Q57,23 62,15" fill="none" stroke="#0a2840" stroke-width="1.4" stroke-linecap="round"/>
  <circle cx="62" cy="15" r="2.8" fill="#E8924A" fill-opacity=".88" stroke="#0a2840" stroke-width=".9"/>
</svg>`
  },
  {
    slug: 'blush',
    name: 'Blush',
    description: 'Painted Lady butterfly',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="50" fill="#F0EAE2"/>
  <path d="M48,43 Q36,22 14,20 Q4,31 8,51 Q18,63 48,55Z" fill="#D06050" fill-opacity=".54" stroke="#3a1008" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M14,20 Q4,31 8,44 Q7,28 13,19Z" fill="#1a0804" fill-opacity=".68"/>
  <circle cx="8" cy="33" r="1.8" fill="white" fill-opacity=".9"/>
  <circle cx="10" cy="25" r="1.4" fill="white" fill-opacity=".84"/>
  <path d="M35,42 Q24,35 15,25" fill="none" stroke="#3a1008" stroke-width=".85" stroke-linecap="round" opacity=".38"/>
  <path d="M52,43 Q64,22 86,20 Q96,31 92,51 Q82,63 52,55Z" fill="#D06050" fill-opacity=".54" stroke="#3a1008" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M86,20 Q96,31 92,44 Q93,28 87,19Z" fill="#1a0804" fill-opacity=".68"/>
  <circle cx="92" cy="33" r="1.8" fill="white" fill-opacity=".9"/>
  <circle cx="90" cy="25" r="1.4" fill="white" fill-opacity=".84"/>
  <path d="M65,42 Q76,35 85,25" fill="none" stroke="#3a1008" stroke-width=".85" stroke-linecap="round" opacity=".38"/>
  <path d="M48,55 Q28,59 16,75 Q13,86 26,91 Q42,92 48,70Z" fill="#C05048" fill-opacity=".48" stroke="#3a1008" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="22" cy="80" r="4.2" fill="#55B2DE" fill-opacity=".64" stroke="#3a1008" stroke-width=".9"/>
  <circle cx="22" cy="80" r="2" fill="#0a1820" fill-opacity=".82"/>
  <path d="M52,55 Q72,59 84,75 Q87,86 74,91 Q58,92 52,70Z" fill="#C05048" fill-opacity=".48" stroke="#3a1008" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="78" cy="80" r="4.2" fill="#55B2DE" fill-opacity=".64" stroke="#3a1008" stroke-width=".9"/>
  <circle cx="78" cy="80" r="2" fill="#0a1820" fill-opacity=".82"/>
  <ellipse cx="50" cy="56" rx="2.3" ry="18" fill="#1a0804" fill-opacity=".9"/>
  <circle cx="50" cy="36" r="4.5" fill="#1a0804" fill-opacity=".88"/>
  <path d="M48,32 Q43,22 38,14" fill="none" stroke="#3a1008" stroke-width="1.4" stroke-linecap="round"/>
  <circle cx="38" cy="14" r="2.8" fill="#55B2DE" fill-opacity=".88" stroke="#3a1008" stroke-width=".9"/>
  <path d="M52,32 Q57,22 62,14" fill="none" stroke="#3a1008" stroke-width="1.4" stroke-linecap="round"/>
  <circle cx="62" cy="14" r="2.8" fill="#55B2DE" fill-opacity=".88" stroke="#3a1008" stroke-width=".9"/>
</svg>`
  },
  {
    slug: 'honey',
    name: 'Honey',
    description: 'Wide honeybee',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="50" fill="#F0EAE2"/>
  <path d="M40,34 Q24,18 10,22 Q6,30 12,38 Q24,44 40,40Z" fill="#55B2DE" fill-opacity=".20" stroke="#1a0c04" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M60,34 Q76,18 90,22 Q94,30 88,38 Q76,44 60,40Z" fill="#55B2DE" fill-opacity=".20" stroke="#1a0c04" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M38,42 Q22,44 16,54 Q16,62 26,60 Q36,58 38,50Z" fill="#55B2DE" fill-opacity=".14" stroke="#1a0c04" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M62,42 Q78,44 84,54 Q84,62 74,60 Q64,58 62,50Z" fill="#55B2DE" fill-opacity=".14" stroke="#1a0c04" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M36,31 Q34,24 50,23 Q66,24 64,31 Q66,43 50,45 Q34,43 36,31Z" fill="#E8A030" fill-opacity=".62" stroke="#1a0c04" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M39,27 Q44,25 50,26 Q56,25 61,27" fill="none" stroke="#1a0c04" stroke-width=".7" stroke-linecap="round" opacity=".38"/>
  <path d="M28,48 Q23,56 25,68 Q27,82 50,87 Q73,82 75,68 Q77,56 72,48 Q64,44 50,44 Q36,44 28,48Z" fill="#F0C030" fill-opacity=".60" stroke="#1a0c04" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M29,57 Q50,53 71,57" fill="none" stroke="#1a0c04" stroke-width="2.8" stroke-linecap="round" opacity=".52"/>
  <path d="M27,67 Q50,63 73,67" fill="none" stroke="#1a0c04" stroke-width="2.8" stroke-linecap="round" opacity=".48"/>
  <path d="M29,77 Q50,73 71,77" fill="none" stroke="#1a0c04" stroke-width="2.4" stroke-linecap="round" opacity=".40"/>
  <path d="M50,87 Q49.5,92 50,95" fill="none" stroke="#1a0c04" stroke-width="1.4" stroke-linecap="round"/>
  <circle cx="50" cy="21" r="8" fill="#E8A030" fill-opacity=".66" stroke="#1a0c04" stroke-width="1.8"/>
  <circle cx="45" cy="21" r="2.2" fill="#1a0c04" fill-opacity=".85"/>
  <circle cx="55" cy="21" r="2.2" fill="#1a0c04" fill-opacity=".85"/>
  <path d="M47,13 Q42,7 37,4" fill="none" stroke="#1a0c04" stroke-width="1.4" stroke-linecap="round"/>
  <circle cx="37" cy="4" r="2.5" fill="#55B2DE" fill-opacity=".88" stroke="#1a0c04" stroke-width=".9"/>
  <path d="M53,13 Q58,7 63,4" fill="none" stroke="#1a0c04" stroke-width="1.4" stroke-linecap="round"/>
  <circle cx="63" cy="4" r="2.5" fill="#55B2DE" fill-opacity=".88" stroke="#1a0c04" stroke-width=".9"/>
</svg>`
  },
  {
    slug: 'rue',
    name: 'Rue',
    description: 'Slim bee',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="50" fill="#F0EAE2"/>
  <path d="M43,27 Q22,10 8,16 Q4,26 10,34 Q22,38 43,32Z" fill="#55B2DE" fill-opacity=".22" stroke="#1a0c04" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M57,27 Q78,10 92,16 Q96,26 90,34 Q78,38 57,32Z" fill="#55B2DE" fill-opacity=".22" stroke="#1a0c04" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M43,33 Q24,36 17,48 Q17,58 27,57 Q37,55 43,43Z" fill="#55B2DE" fill-opacity=".15" stroke="#1a0c04" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M57,33 Q76,36 83,48 Q83,58 73,57 Q63,55 57,43Z" fill="#55B2DE" fill-opacity=".15" stroke="#1a0c04" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M43,24 Q42,18 50,17 Q58,18 57,24 Q58,34 50,35 Q42,34 43,24Z" fill="#E8A030" fill-opacity=".62" stroke="#1a0c04" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M44,37 Q41,48 41,63 Q41,78 50,88 Q59,78 59,63 Q59,48 56,37 Q53,34 50,34 Q47,34 44,37Z" fill="#F0C030" fill-opacity=".60" stroke="#1a0c04" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M42,47 Q50,45 58,47" fill="none" stroke="#1a0c04" stroke-width="2.0" stroke-linecap="round" opacity=".52"/>
  <path d="M41,57 Q50,55 59,57" fill="none" stroke="#1a0c04" stroke-width="2.0" stroke-linecap="round" opacity=".48"/>
  <path d="M41,67 Q50,65 59,67" fill="none" stroke="#1a0c04" stroke-width="2.0" stroke-linecap="round" opacity=".44"/>
  <path d="M42,77 Q50,75 58,77" fill="none" stroke="#1a0c04" stroke-width="1.6" stroke-linecap="round" opacity=".36"/>
  <path d="M50,88 Q49.5,93 50,97" fill="none" stroke="#1a0c04" stroke-width="1.3" stroke-linecap="round"/>
  <circle cx="50" cy="16" r="5.5" fill="#E8A030" fill-opacity=".66" stroke="#1a0c04" stroke-width="1.6"/>
  <circle cx="46.5" cy="16" r="1.8" fill="#1a0c04" fill-opacity=".85"/>
  <circle cx="53.5" cy="16" r="1.8" fill="#1a0c04" fill-opacity=".85"/>
  <path d="M48,11 Q43,5 38,3" fill="none" stroke="#1a0c04" stroke-width="1.3" stroke-linecap="round"/>
  <circle cx="38" cy="3" r="2.2" fill="#55B2DE" fill-opacity=".88" stroke="#1a0c04" stroke-width=".8"/>
  <path d="M52,11 Q57,5 62,3" fill="none" stroke="#1a0c04" stroke-width="1.3" stroke-linecap="round"/>
  <circle cx="62" cy="3" r="2.2" fill="#55B2DE" fill-opacity=".88" stroke="#1a0c04" stroke-width=".8"/>
</svg>`
  },
  {
    slug: 'bumble',
    name: 'Bumble',
    description: 'Classic bumblebee',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="50" fill="#F0EAE2"/>
  <path d="M40,36 Q24,20 10,24 Q6,32 12,40 Q24,45 40,42Z" fill="#55B2DE" fill-opacity=".20" stroke="#1a0c04" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M60,36 Q76,20 90,24 Q94,32 88,40 Q76,45 60,42Z" fill="#55B2DE" fill-opacity=".20" stroke="#1a0c04" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M38,44 Q22,46 16,56 Q16,64 26,63 Q36,61 38,51Z" fill="#55B2DE" fill-opacity=".14" stroke="#1a0c04" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M62,44 Q78,46 84,56 Q84,64 74,63 Q64,61 62,51Z" fill="#55B2DE" fill-opacity=".14" stroke="#1a0c04" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M37,31 Q36,24 50,23 Q64,24 63,31 Q65,43 50,45 Q35,43 37,31Z" fill="#C87820" fill-opacity=".62" stroke="#1a0c04" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M39,27 Q44,25 50,26 Q56,25 61,27" fill="none" stroke="#1a0c04" stroke-width=".75" stroke-linecap="round" opacity=".38"/>
  <path d="M38,33 Q44,31 50,32 Q56,31 62,33" fill="none" stroke="#1a0c04" stroke-width=".75" stroke-linecap="round" opacity=".32"/>
  <path d="M34,48 Q31,56 32,66 Q34,80 50,86 Q66,80 68,66 Q69,56 66,48 Q60,44 50,44 Q40,44 34,48Z" fill="#F0C030" fill-opacity=".60" stroke="#1a0c04" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M34,57 Q50,53 66,57" fill="none" stroke="#1a0c04" stroke-width="2.6" stroke-linecap="round" opacity=".52"/>
  <path d="M33,67 Q50,63 67,67" fill="none" stroke="#1a0c04" stroke-width="2.6" stroke-linecap="round" opacity=".48"/>
  <path d="M34,77 Q50,73 66,77" fill="none" stroke="#1a0c04" stroke-width="2.2" stroke-linecap="round" opacity=".40"/>
  <path d="M50,86 Q49.5,91 50,94" fill="none" stroke="#1a0c04" stroke-width="1.4" stroke-linecap="round"/>
  <circle cx="50" cy="22" r="8" fill="#E8A030" fill-opacity=".66" stroke="#1a0c04" stroke-width="1.8"/>
  <path d="M43,16 Q50,13 57,16" fill="none" stroke="#1a0c04" stroke-width=".9" stroke-linecap="round" opacity=".38"/>
  <circle cx="45" cy="22" r="2.2" fill="#1a0c04" fill-opacity=".85"/>
  <circle cx="55" cy="22" r="2.2" fill="#1a0c04" fill-opacity=".85"/>
  <path d="M47,14 Q42,7 37,4" fill="none" stroke="#1a0c04" stroke-width="1.4" stroke-linecap="round"/>
  <circle cx="37" cy="4" r="2.5" fill="#55B2DE" fill-opacity=".88" stroke="#1a0c04" stroke-width=".9"/>
  <path d="M53,14 Q58,7 63,4" fill="none" stroke="#1a0c04" stroke-width="1.4" stroke-linecap="round"/>
  <circle cx="63" cy="4" r="2.5" fill="#55B2DE" fill-opacity=".88" stroke="#1a0c04" stroke-width=".9"/>
</svg>`
  }
]

export const DEFAULT_AVATAR: AvatarSlug = 'marigold'

export function getAvatarBySlug(slug: string | null | undefined): AvatarDefinition {
  return AVATARS.find(a => a.slug === slug) || AVATARS[0]
}
