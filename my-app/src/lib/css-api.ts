// CSS API Integration Service
// Fixed values from API Documentation

const CSS_API_URL = 'https://api-css.senxgroup.com/api/complaint-list/create-by-other';

// Fixed API Configuration from Documentation
const FIXED_CONFIG = {
  apiKey: 'ca03na188ame03u1d78620de67282882a84',
  endpoint: CSS_API_URL,
};

interface CSSFieldMapping {
  jobDetail: string;
  customerName?: string;
  telephone?: string;
  email?: string;
}

interface SubmissionAnswers {
  [fieldId: string]: any;
}

interface QRData {
  utm_medium?: string;
  utm_source?: string;
  utm_campaign?: string;
}

/**
 * Send submission data to CSS API
 * 
 * Note: Contact Channel ID และ User Created ID ต้องถามผู้ใช้ว่ามีค่าคงที่หรือต้องเลือก
 * ชั่วคราวใช้ค่าจากฟิลด์หรือ default ไปก่อน
 */
export async function sendToCSS(
  answers: SubmissionAnswers,
  fieldMapping: CSSFieldMapping,
  contactChannelId: string,
  userCreated: string,
  qrData?: QRData
): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    // Validate required fields
    if (!contactChannelId || !userCreated) {
      return { success: false, error: 'Missing Contact Channel ID or User Created ID' };
    }

    if (!fieldMapping.jobDetail) {
      return { success: false, error: 'Missing job_detail field mapping' };
    }

    // Extract values from answers based on mapping
    const jobDetail = answers[fieldMapping.jobDetail];

    if (!jobDetail) {
      return { success: false, error: 'Job detail is empty' };
    }

    const customerName = fieldMapping.customerName ? answers[fieldMapping.customerName] : undefined;
    const telephone = fieldMapping.telephone ? answers[fieldMapping.telephone] : undefined;
    const email = fieldMapping.email ? answers[fieldMapping.email] : undefined;

    // Build payload - ใช้ utm_medium จาก QR เป็น project_id
    const payload: any = {
      project_id: qrData?.utm_medium || 'default',
      contact_channel_id: contactChannelId,
      job_detail: typeof jobDetail === 'string' ? jobDetail : JSON.stringify(jobDetail),
      user_created: userCreated,
    };

    // Add optional fields if they exist
    if (customerName) payload.customer_name = String(customerName);
    if (telephone) payload.telephone = String(telephone);
    if (email) payload.email = String(email);

    // Add house_name if available in answers
    const houseName = answers['house_name'] || answers['project_name'] || answers['location'];
    if (houseName) payload.house_name = String(houseName);

    console.log('[CSS API] Sending payload:', payload);

    // Send request via proxy API to avoid CORS
    const response = await fetch('/api/css', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    console.log('[CSS API] Response:', result);

    if (!result.success) {
      const errorMsg = result.data?.message || result.data?.error || `CSS API Error: ${result.status}`;
      console.error('[CSS API] Error:', errorMsg);
      return { success: false, error: errorMsg };
    }

    return { success: true, data: result.data };
  } catch (err: any) {
    console.error('[CSS API] Exception:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Test CSS API connection with fixed API Key
 */
export async function testCSSConnection(
  contactChannelId: string,
  userCreated: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!contactChannelId || !userCreated) {
      return { success: false, error: 'Missing required configuration' };
    }

    // Try to send a test payload via proxy API
    const response = await fetch('/api/css', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        project_id: 'test',
        contact_channel_id: contactChannelId,
        job_detail: 'Test connection',
        user_created: userCreated,
      }),
    });

    // Even if validation fails (400), auth success tells us config is working
    if (response.status === 401 || response.status === 403) {
      return { success: false, error: 'Invalid API Key' };
    }

    // Any other response means we reached the server
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
