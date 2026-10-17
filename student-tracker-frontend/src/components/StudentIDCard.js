import React, { useRef } from "react";
import { Modal, Button } from "react-bootstrap";
import {
  PrinterFill,
  XCircleFill,
  PersonBadgeFill,
  QrCode,
  ShieldCheck,
} from "react-bootstrap-icons";

const API_BASE_URL =
  process.env.REACT_APP_PRODUCTION_API || "http://localhost:8080";

const StudentIDCard = ({ student, show, onHide }) => {
  const cardRef = useRef(null);

  if (!student) return null;

  const photoUrl = student.profilePicture
    ? `${API_BASE_URL}/student/${student.id}/photo?t=${Date.now()}`
    : null;

  const formattedId = `STU-2026-${String(student.id).padStart(4, "0")}`;
  const hairColorClean = (student.hairColor || "navy").trim();

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="bg-slate-900 text-white">
        <Modal.Title className="text-lg font-bold flex items-center gap-2">
          <PersonBadgeFill className="text-amber-400" /> Official Student ID Card
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="bg-slate-100 p-4">
        {/* Printable Card Container */}
        <div className="flex justify-center my-2">
          <div
            ref={cardRef}
            id="printable-id-card"
            className="w-[420px] rounded-2xl shadow-2xl overflow-hidden bg-white border border-slate-300 relative text-slate-800"
            style={{
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
            }}
          >
            {/* Top Header Banner */}
            <div
              className="p-4 text-white text-center relative"
              style={{
                background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                borderBottom: `4px solid ${hairColorClean}`,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🎓</span>
                  <div className="text-left">
                    <h5 className="font-extrabold text-sm tracking-wider uppercase m-0 leading-tight">
                      Student Tracker Academy
                    </h5>
                    <p className="text-[10px] text-amber-300 uppercase tracking-widest font-semibold m-0">
                      Academic Year 2026 – 2027
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                    STUDENT
                  </span>
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-4 bg-gradient-to-b from-white via-slate-50 to-slate-100">
              <div className="flex gap-4 items-center">
                {/* Photo with dynamic hair-color border */}
                <div className="relative">
                  <div
                    className="w-24 h-28 rounded-xl overflow-hidden bg-slate-200 border-2 shadow-inner flex items-center justify-center"
                    style={{ borderColor: hairColorClean }}
                  >
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={student.name}
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="text-center">
                        <span className="text-3xl block font-bold text-slate-400">
                          {student.name ? student.name.charAt(0).toUpperCase() : "S"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">NO PHOTO</span>
                      </div>
                    )}
                  </div>
                  {/* Holographic Security Badge */}
                  <div className="absolute -bottom-2 -right-2 bg-gradient-to-tr from-amber-400 to-yellow-200 rounded-full p-1 shadow-md border border-white">
                    <ShieldCheck size={14} className="text-slate-900" />
                  </div>
                </div>

                {/* Student Info Details */}
                <div className="flex-1 text-xs">
                  <h4 className="font-black text-slate-900 text-base mb-1 tracking-tight leading-tight">
                    {student.name}
                  </h4>
                  <div className="space-y-0.5 text-slate-600">
                    <div>
                      <span className="font-semibold text-slate-400 uppercase text-[9px] block">
                        Student ID
                      </span>
                      <strong className="text-slate-900 text-sm font-mono tracking-wider">
                        {formattedId}
                      </strong>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-400 uppercase text-[9px] block">
                        Email Address
                      </span>
                      <span className="text-slate-700 font-medium truncate block max-w-[220px]">
                        {student.email}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-200 text-center">
                <div className="bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm">
                  <span className="text-[9px] text-slate-400 block font-bold uppercase">
                    GPA
                  </span>
                  <span className="text-xs font-black text-amber-600">
                    {student.gpa} / 4.5
                  </span>
                </div>
                <div className="bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm">
                  <span className="text-[9px] text-slate-400 block font-bold uppercase">
                    Height
                  </span>
                  <span className="text-xs font-black text-slate-800">
                    {student.height} cm
                  </span>
                </div>
                <div className="bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm">
                  <span className="text-[9px] text-slate-400 block font-bold uppercase">
                    Weight
                  </span>
                  <span className="text-xs font-black text-slate-800">
                    {student.weight} kg
                  </span>
                </div>
              </div>

              {/* Bottom Security / Barcode Strip */}
              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                {/* Visual Barcode */}
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-[2px] h-6 bg-white px-2 py-0.5 rounded border border-slate-200">
                    <span className="w-[2px] h-4 bg-slate-900"></span>
                    <span className="w-[1px] h-4 bg-slate-900"></span>
                    <span className="w-[3px] h-4 bg-slate-900"></span>
                    <span className="w-[1px] h-4 bg-slate-900"></span>
                    <span className="w-[2px] h-4 bg-slate-900"></span>
                    <span className="w-[4px] h-4 bg-slate-900"></span>
                    <span className="w-[1px] h-4 bg-slate-900"></span>
                    <span className="w-[2px] h-4 bg-slate-900"></span>
                    <span className="w-[3px] h-4 bg-slate-900"></span>
                    <span className="w-[1px] h-4 bg-slate-900"></span>
                    <span className="w-[2px] h-4 bg-slate-900"></span>
                    <span className="w-[4px] h-4 bg-slate-900"></span>
                  </div>
                  <span className="text-[8px] font-mono text-slate-400 mt-0.5 tracking-widest">
                    {student.id}-{student.height}-{student.weight}
                  </span>
                </div>

                {/* QR Code and Authorized Signature */}
                <div className="flex items-center gap-2">
                  <QrCode size={26} className="text-slate-800" />
                  <div className="text-right">
                    <div className="font-serif italic text-[11px] text-slate-600 border-b border-slate-400 px-1 leading-none">
                      Dean of Academics
                    </div>
                    <span className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">
                      Authorized Signature
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Print Styles injected for this modal */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-id-card, #printable-id-card * {
              visibility: visible;
            }
            #printable-id-card {
              position: absolute;
              left: 50%;
              top: 30%;
              transform: translate(-50%, -50%);
              box-shadow: none !important;
              border: 1px solid #94a3b8 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        ` }} />
      </Modal.Body>

      <Modal.Footer className="bg-slate-50 flex justify-between">
        <Button variant="secondary" size="sm" onClick={onHide} className="flex items-center gap-1">
          <XCircleFill /> Close
        </Button>
        <Button variant="danger" size="sm" onClick={handlePrint} className="flex items-center gap-1 font-bold">
          <PrinterFill /> Print / Save as PDF
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default StudentIDCard;

