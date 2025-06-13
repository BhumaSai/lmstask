export const COURSE_CATEGORIES = [
    { value: 'programming', label: 'Programming' },
    { value: 'web development', label: 'Web Development' },
    { value: 'mobile development', label: 'Mobile Development' },
    { value: 'data science', label: 'Data Science' },
    { value: 'machine learning', label: 'Machine Learning' },
    { value: 'devops', label: 'DevOps' },
    { value: 'business', label: 'Business' },
    { value: 'design', label: 'Design' },
    { value: 'other', label: 'Other' }
] as const;

export const COURSE_LEVELS = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
] as const;

export type CourseCategory = typeof COURSE_CATEGORIES[number]['value'];
export type CourseLevel = typeof COURSE_LEVELS[number]['value']; 