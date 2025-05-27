import { Difficulty } from '@prisma/client';
import { Enum, EnumType } from 'ts-jenum';

export type EDifficultyProps = 'LOW' | 'MIDDLE' | 'HIGH' | 'HIGHEST';

@Enum('code')
export class EDifficulty extends EnumType<EDifficulty>() {
  static readonly LOW: EDifficulty = new EDifficulty('LOW', '(하)', 1);
  static readonly MIDDLE: EDifficulty = new EDifficulty('MIDDLE', '(중)', 2);
  static readonly HIGH: EDifficulty = new EDifficulty('HIGH', '(상)', 3);
  static readonly HIGHEST: EDifficulty = new EDifficulty('HIGHEST', '(최상)', 4);

  private constructor(
    private readonly _code: EDifficultyProps,
    private readonly _name: string,
    private readonly _sort: number,
  ) {
    super();
  }

  get code(): EDifficultyProps {
    return this._code;
  }

  get name(): string {
    return this._name;
  }

  get sort(): number {
    return this._sort;
  }

  static pick(...props: EDifficultyProps[]): EDifficulty[] {
    return this.values().filter((e) => props.map((v) => v.toString()).includes(e.code));
  }

  static omit(...props: EDifficultyProps[]): EDifficulty[] {
    return this.values().filter((e) => !props.map((v) => v.toString()).includes(e.code));
  }

  static asString(order: 'ASC' | 'DESC' = 'ASC'): string[] {
    const enums = this.values().map((v) => ({ code: v.code, sort: v.sort }));
    if (order === 'DESC') return enums.sort((a, b) => b.sort - a.sort).map((v) => v.code);
    return enums.map((v) => v.code.toString());
  }

  static getAdvanced(prop: Difficulty): Difficulty {
    switch (prop) {
      case 'LOW':
        return EDifficulty.MIDDLE.code;
      case 'MIDDLE':
        return EDifficulty.HIGH.code;
      case 'HIGH':
        return EDifficulty.HIGHEST.code;
      case 'HIGHEST':
        return EDifficulty.HIGHEST.code;
    }
  }

  static getBasic(prop: Difficulty): Difficulty {
    switch (prop) {
      case 'HIGHEST':
        return EDifficulty.HIGH.code;
      case 'HIGH':
        return EDifficulty.MIDDLE.code;
      case 'MIDDLE':
        return EDifficulty.LOW.code;
      case 'LOW':
        return EDifficulty.LOW.code;
    }
  }

  static getFromPrisma(prop: Difficulty): EDifficulty {
    switch (prop) {
      case 'HIGHEST':
        return EDifficulty.HIGHEST;
      case 'HIGH':
        return EDifficulty.HIGH;
      case 'MIDDLE':
        return EDifficulty.MIDDLE;
      default:
        return EDifficulty.LOW;
    }
  }
}
