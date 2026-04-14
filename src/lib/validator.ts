export const validateEmail = (email: string): string | null => {
    const emailTrimmed = email.trim();

    if (!emailTrimmed) {
        return "Email address is required.";
    }

    // Standard RFC 5322 Regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(emailTrimmed)) {
        return "Please enter a valid email address.";
    }

    return null;
};