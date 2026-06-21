import React from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { CloudUpload } from 'lucide-react';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFileSelect }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx', '.xls'],
    },
    multiple: false,
    onDrop: (acceptedFiles: File[]) => {
      if (acceptedFiles.length) {
        onFileSelect(acceptedFiles[0]);
      }
    },
  });

  return (
    <div
      {...getRootProps()}
      className="relative p-8 border-2 border-dashed border-gray-300 rounded-3xl bg-white hover:bg-gray-50 transition cursor-pointer"
    >
      <input {...getInputProps()} />
      <motion.div
        animate={{ scale: isDragActive ? 1.05 : 1 }}
        className="flex flex-col items-center justify-center text-center"
      >
        <CloudUpload className="w-12 h-12 text-gray-500 mb-2" />
        <p className="text-gray-600">{isDragActive ? 'Soo daadi faylka halkan...' : 'Jiida oo dhig file CSV/Excel ama guji si aad u doorato'}</p>
      </motion.div>
    </div>
  );
};
