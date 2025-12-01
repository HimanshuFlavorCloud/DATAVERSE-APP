export function combineClasses(
  ...classes: Array<string | false | null | undefined>
) {
  return classes.filter(Boolean).join(" ");
}
