/**
 * Prefixed props for a component's inner parts: MixinProps<"label", LabelProps> adds labelClassName, labelStyle...
 * splitProps(props, "label") hands them back as { label: { className, style }, rest }.
 */
export type MixinProps<Mixin extends string, Props> = {
  [Key in keyof Props as `${Mixin}${Capitalize<Key & string>}`]: Props[Key];
};

// Mixins that extend this one: "triggerValue" for "trigger".
type LongerMixins<Mixin extends string, All extends string> = All extends `${Mixin}${infer Rest}`
  ? Rest extends ""
    ? never
    : All
  : never;

// A key belongs to its longest matching mixin, and the prefix must end at a capital: "items" isn't part of "item".
type OwnedKey<Key, Mixin extends string, All extends string> = Key extends `${Mixin}${Capitalize<string>}`
  ? Key extends `${LongerMixins<Mixin, All>}${Capitalize<string>}`
    ? never
    : Key
  : never;

type SplitProps<Props, Mixins extends string> = {
  [Mixin in Mixins]: {
    [
      Key in keyof Props as Key extends OwnedKey<Key, Mixin, Mixins>
        ? Key extends `${Mixin}${infer Name}`
          ? Uncapitalize<Name>
          : never
        : never
    ]: Props[Key];
  };
} & {
  rest: Omit<Props, { [Mixin in Mixins]: OwnedKey<keyof Props, Mixin, Mixins> }[Mixins]>;
};

export function splitProps<Props extends object, const Mixins extends string[]>(
  props: Props,
  ...mixins: Mixins
): SplitProps<Props, Mixins[number]> {
  const result: Record<string, Record<string, unknown>> = { rest: {} };
  for (const mixin of mixins) result[mixin] = {};

  const longestFirst = [...mixins].sort((a, b) => b.length - a.length);

  for (const [key, value] of Object.entries(props)) {
    const mixin = longestFirst.find((m) => {
      const next = key[m.length];
      return key.startsWith(m) && next !== undefined && next !== next.toLowerCase();
    });

    if (mixin) {
      const name = key.slice(mixin.length);
      result[mixin][name[0].toLowerCase() + name.slice(1)] = value;
    } else {
      result.rest[key] = value;
    }
  }

  return result as SplitProps<Props, Mixins[number]>;
}
