import { z } from 'zod';

const contentTypeEnum = z.enum(['ConceptShared', 'Reference', 'ProblemSolving', 'Announcement']);

const reportSchema = z.object({
  authorUuid: z.string().uuid(),
  fileData: z
    .array(
      z.object({
        bucketName: z.string(),
        filePath: z.string(),
      }),
    )
    .optional(),
  contentType: contentTypeEnum,
  title: z.string().optional(),
  content: z.string(),
  contentCreationTime: z.date(),
  contentIdInDb: z.number().optional(),
});

interface ReportFormValidationResult {
  isValid: boolean;
  error?: any;
}

export function validateReportJSONString(reportForm: string): ReportFormValidationResult {
  try {
    const parsedData = JSON.parse(reportForm);
    const result = reportSchema.safeParse(parsedData);
    if (!result.success) {
      return { isValid: false, error: result.error.errors.join(', ') };
    } else {
      return { isValid: true };
    }
  } catch (error) {
    return { isValid: false, error: error };
  }
}
