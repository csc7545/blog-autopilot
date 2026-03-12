export const config = {
  gemini: {
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    temperature: 0.4,
    maxRetries: 3,
    timeout: 30000,
  },
  image: {
    maxImagesPerPost: 3,
    defaultSize: '1024x1024',
  },
  pipeline: {
    maxRetries: 3,
    timeout: 30000,
  },
  naver: {
    loginUrl: 'https://nid.naver.com/nidlogin.login',
    editorUrlTemplate: 'https://blog.naver.com/{username}/postwrite',
    loginTimeout: 30000,
    editorTimeout: 60000,
    publishTimeout: 30000,
  },
};
