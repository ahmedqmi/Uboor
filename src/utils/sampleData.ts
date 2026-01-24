import { v4 as uuidv4 } from 'uuid';
import type { TravelRequest } from '../types';

// Sample data for testing
export const sampleTravelRequests: TravelRequest[] = [
  {
    id: uuidv4(),
    carPlateNumber: 'أ ب ج ١٢٣٤',
    carType: 'تويوتا كامري',
    carColor: 'أبيض',
    passengers: [
      {
        id: uuidv4(),
        name: 'أحمد محمد العلي',
        documentType: 'passport',
        documentNumber: 'A12345678',
      },
      {
        id: uuidv4(),
        name: 'سارة أحمد الخالد',
        documentType: 'id_card',
        documentNumber: '1234567890',
      },
    ],
    submittedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    status: 'pending',
  },
  {
    id: uuidv4(),
    carPlateNumber: 'ر س ط ٥٦٧٨',
    carType: 'هوندا أكورد',
    carColor: 'أسود',
    passengers: [
      {
        id: uuidv4(),
        name: 'خالد عبدالله السعيد',
        documentType: 'passport',
        documentNumber: '999888777', // Suspicious - starts with 999
      },
      {
        id: uuidv4(),
        name: 'فاطمة علي الحسن',
        documentType: 'id_card',
        documentNumber: '9876543210',
      },
    ],
    submittedAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    status: 'flagged',
  },
  {
    id: uuidv4(),
    carPlateNumber: 'ك ل م ٩٠١٢',
    carType: 'نيسان التيما',
    carColor: 'فضي',
    passengers: [
      {
        id: uuidv4(),
        name: 'عمر يوسف الرشيد',
        documentType: 'passport',
        documentNumber: '000123456', // Suspicious - starts with 000
      },
    ],
    submittedAt: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
    status: 'flagged',
  },
  {
    id: uuidv4(),
    carPlateNumber: 'هـ و ي ٣٤٥٦',
    carType: 'كيا سيراتو',
    carColor: 'أزرق',
    passengers: [
      {
        id: uuidv4(),
        name: 'محمد سعد القحطاني',
        documentType: 'id_card',
        documentNumber: '2233445566',
      },
      {
        id: uuidv4(),
        name: 'نورة فهد العتيبي',
        documentType: 'passport',
        documentNumber: 'B98765432',
      },
      {
        id: uuidv4(),
        name: 'مجهول الهوية', // Suspicious name
        documentType: 'id_card',
        documentNumber: '1122334455',
      },
    ],
    submittedAt: new Date(Date.now() - 1000 * 60 * 180), // 3 hours ago
    status: 'flagged',
  },
  {
    id: uuidv4(),
    carPlateNumber: 'ع ص ق ٧٨٩٠',
    carType: 'شيفروليه ماليبو',
    carColor: 'رمادي',
    passengers: [
      {
        id: uuidv4(),
        name: 'عبدالرحمن إبراهيم الدوسري',
        documentType: 'passport',
        documentNumber: 'C55667788',
      },
    ],
    submittedAt: new Date(Date.now() - 1000 * 60 * 240), // 4 hours ago
    status: 'approved',
  },
  {
    id: uuidv4(),
    carPlateNumber: 'ب ت ث ٢٤٦٨',
    carType: 'مازدا 6',
    carColor: 'أحمر',
    passengers: [
      {
        id: uuidv4(),
        name: 'سلطان ناصر الشمري',
        documentType: 'id_card',
        documentNumber: '123456789', // Suspicious - starts with 123
      },
      {
        id: uuidv4(),
        name: 'هند سعود المالكي',
        documentType: 'passport',
        documentNumber: 'D11223344',
      },
    ],
    submittedAt: new Date(Date.now() - 1000 * 60 * 300), // 5 hours ago
    status: 'flagged',
  },
];
