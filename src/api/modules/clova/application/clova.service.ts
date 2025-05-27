import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClovaMessageDto, ClovaRole } from './dto/message.dto';
import { from } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { BotType } from './dto';

@Injectable()
export class ClovaService {
  private readonly logger: Logger = new Logger(ClovaService.name);
  constructor(private readonly config: ConfigService) {}
  async getCompletion(messages: ClovaMessageDto[], type: BotType, requestId?: string) {
    const usingRequestId = requestId || uuidv4();
    const constructedMessages: ClovaMessageDto[] = [this.generateSystemMessage(type)];
    for (const message of messages) {
      constructedMessages.push({
        role: message.role,
        content: message.content,
      });
    }
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json',
      'X-NCP-CLOVASTUDIO-API-KEY': this.config.get('CLOVA_STUDIO_API_KEY')!,
      'X-NCP-APIGW-API-KEY': this.config.get('CLOVA_API_GATEWAY_API_KEY')!,
      Accept: 'text/event-stream',
      'X-NCP-CLOVASTUDIO-REQUEST-ID': usingRequestId,
    };

    const url = this.config.get('CLOVA_STUDIO_URL')! + this.config.get('CLOVA_MODEL')!;
    const data = { messages: constructedMessages, maxTokens: 1000 };
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data),
    });

    const body = response.body;
    // function parseString(input: string) {
    //   try {
    //     const result: { [key: string]: any } = {};
    //     const parts = input.split('\n');
    //     for (const part of parts) {
    //       if (part.length !== 0) {
    //         if (part.includes('data:')) {
    //           const data = part.split('data:')[1];
    //           if (data.length > 0) result['data'] = JSON.parse(data);
    //         } else {
    //           const [key, value] = part.split(':');
    //           result[key] = value;
    //         }
    //       }
    //     }
    //     return result;
    //   } catch (error) {}
    // }

    async function* streamAsyncIterable() {
      if (body) {
        yield 'EXAMPLE CLOVA STRING';
        // let stringified = '';
        // for await (const chunk of body) {
        //   if (chunk) {
        //     if (stringified.length === 0) {
        //       stringified = new TextDecoder().decode(chunk);
        //       if (stringified.endsWith(':')) {
        //         continue;
        //       }
        //     } else {
        //       stringified += new TextDecoder().decode(chunk);
        //     }
        //     const parsed = parseString(stringified);
        //     let message = undefined;
        //     if (parsed!['data']) {
        //       message = parsed!['data']['message'];
        //     }
        //     const result = {
        //       requestId: usingRequestId,
        //       event: eventFromString(parsed!['event']),
        //       message: message,
        //     };

        //     yield JSON.stringify(result);
        //     stringified = '';
        //   }
        // }
      }
    }

    return from(streamAsyncIterable());
  }

  protected generateSystemMessage(type: BotType): ClovaMessageDto {
    switch (type) {
      case BotType.MATH_TUTOR:
        return {
          role: ClovaRole.SYSTEM,
          content:
            "You are 매튜 AI, an artificial intelligence that will be used in math classes for middle and high school students in South Korea.\nBelow are some specific commands or instructions for communicating with you as 매튜 AI:\n'''''''''''''''''''''\n1. Language: Communicate only in Korean to ensure clarity and accessibility for all explanations, responses, and interactions. I don'''t want to see the latex language, I want to see the Korean language right away.\n2. Character limit: Keep responses under 4000 characters.\n3. Formula Limit: Do not use the following formulas in your explanation:\n 1) Partial derivatives.\n 2) Fermat'''s Little Theorem and Fermat'''s Theorem.\n 3) Newton-Raphson method.\n 4) Modular arithmetic.\n4. adjusting formal expressions:\n 1) Referring to '''Vieta'''s theorem''' as '''the relation between roots and coefficients'''.\n 2) Refer to '''공액''' as '''켤레복소수'''.\n 3) Refer to '''뿌리''' as '''근'''.\n 4) Replace '''선형''' with '''일차'''.\n 5) Replace '''큐빅 함수''' with '''삼차 함수'''.\n 6) Replace '''선형 함수''' with '''일차 함수'''.\n\n\nHTML Format: Responses should be in HTML format, with mathematical formulas enclosed within parentheses.",
        };
      case BotType.JOB_ADVISOR:
        return {
          role: ClovaRole.SYSTEM,
          content:
            '너는 직업에 대해 간략히 설명해주는 매튜 AI야. 학생이 직업에 대해 물어보면 직업에 대한 간략한 설명 한 문장, 어떻게 될 수 있는지에 대해 간략히 세 문장, 업무 강도가 어떤지에 대해 한 문장, 평균 연봉이 얼마 정도인지에 대해 한 문장, 해당 직업의 행복지수가 어느 정도인지에 대해 한 문장, 이렇게 답을 해줘.',
        };
    }
  }
}
