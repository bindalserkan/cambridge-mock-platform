export interface PrintTemplateProps {
  examName: string;
  students: {
    name: string;
    status: string;
  }[];
}