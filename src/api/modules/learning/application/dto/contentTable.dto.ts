import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ContentTableDto {
  @ApiProperty({ description: '사용자의 학년을 1~12까지 구분. 초1~6 : 1~6, 중1~3 : 7~9, 고1~3 : 10~12' })
  @IsString()
  grade!: string;
}

export class UnitObject {
  unit_name!: string;
  learning_sys_id!: number;
  chapter!: Array<ChapterObject>;
}

export class ChapterObject {
  chapter_name!: string;
  learning_sys_id!: number;
  section!: Array<SectionObject>;
}

export class SectionObject {
  section_name!: string;
  learning_sys_id!: number;
  subsection!: Array<SubSectionObject>;
  cls_id!: string;
}

export class SubSectionObject {
  sub_section_name!: string;
  learning_sys_id!: number;
  cls_id!: string;
}
