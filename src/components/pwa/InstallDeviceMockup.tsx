import { Apple, Check, MoreVertical, Plus, Share2 } from 'lucide-react';

type Device = 'ios' | 'android';

interface Props {
  device: Device;
}

function TrackerPreview() {
  return (
    <div className="space-y-3 px-4 pt-5">
      <div className="flex items-center gap-2">
        <img src="/icon-192.png?v=psa5" alt="" className="h-8 w-8 rounded-[10px]" />
        <div>
          <p className="text-[11px] font-bold leading-tight text-[#0B1F33]">PEPTIDE</p>
          <p className="text-[8px] font-semibold tracking-[0.16em] text-[#149F99]">SOUTH AFRICA</p>
        </div>
      </div>
      <div className="rounded-2xl bg-[#082B57] p-4 text-white shadow-lg">
        <p className="text-[9px] font-medium text-white/70">Today</p>
        <p className="mt-1 text-[16px] font-semibold">Your protocol, simplified.</p>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/20">
          <div className="h-full w-2/3 rounded-full bg-[#4DC7C0]" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-[#DBE6E7] bg-white p-3">
          <p className="text-[8px] text-[#5D7182]">Next dose</p>
          <p className="mt-1 text-[11px] font-semibold text-[#0B1F33]">08:00</p>
        </div>
        <div className="rounded-xl border border-[#DBE6E7] bg-[#E8F7F5] p-3">
          <p className="text-[8px] text-[#5D7182]">Adherence</p>
          <p className="mt-1 text-[11px] font-semibold text-[#082B57]">92%</p>
        </div>
      </div>
    </div>
  );
}

export function InstallDeviceMockup({ device }: Props) {
  const ios = device === 'ios';

  return (
    <div className="mx-auto w-full max-w-[310px]" aria-label={`${ios ? 'iPhone' : 'Android'} installation preview`}>
      <div className={`relative overflow-hidden border-[7px] border-[#0B1F33] bg-[#F4F8F8] shadow-2xl ${ios ? 'rounded-[42px]' : 'rounded-[30px]'}`}>
        <div className="relative h-[548px]">
          {ios ? (
            <>
              <div className="absolute left-1/2 top-2 z-20 h-5 w-20 -translate-x-1/2 rounded-full bg-[#0B1F33]" />
              <div className="flex h-10 items-center justify-between px-5 pt-2 text-[9px] font-semibold text-[#0B1F33]">
                <span>9:41</span><span>5G&nbsp;&nbsp;●</span>
              </div>
            </>
          ) : (
            <div className="flex h-8 items-center justify-between bg-white px-4 text-[9px] font-semibold text-[#0B1F33]">
              <span>9:41</span><span>5G&nbsp;&nbsp;●</span>
            </div>
          )}

          {!ios && (
            <div className="mx-3 mt-2 flex h-10 items-center gap-2 rounded-full bg-white px-3 shadow-sm">
              <span className="text-[#149F99]">●</span>
              <span className="flex-1 truncate text-[9px] font-medium text-[#5D7182]">peptide-south-africa.co.za</span>
              <MoreVertical className="h-4 w-4 text-[#082B57]" />
            </div>
          )}

          <TrackerPreview />

          {ios ? (
            <>
              <div className="absolute inset-x-2 bottom-2 rounded-[28px] border border-[#DBE6E7] bg-white/95 p-3 shadow-2xl backdrop-blur">
                <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#DBE6E7]" />
                <div className="flex items-center gap-3 rounded-2xl bg-[#F4F8F8] p-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#E8F7F5] text-[#149F99]">
                    <Plus className="h-5 w-5" />
                  </span>
                  <div className="flex-1">
                    <p className="text-[11px] font-semibold text-[#0B1F33]">Add to Home Screen</p>
                    <p className="text-[8px] text-[#5D7182]">Open the tracker like an app</p>
                  </div>
                  <Check className="h-4 w-4 text-[#149F99]" />
                </div>
                <div className="mt-3 flex items-center justify-between px-4 text-[#082B57]">
                  <span className="text-[9px] text-[#5D7182]">Safari</span>
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#082B57] text-white shadow-lg">
                    <Share2 className="h-4 w-4" />
                  </span>
                  <span className="text-[9px] font-semibold">Add</span>
                </div>
              </div>
              <div className="absolute bottom-0 left-1/2 z-30 h-1 w-24 -translate-x-1/2 rounded-full bg-[#0B1F33]" />
            </>
          ) : (
            <div className="absolute inset-x-4 bottom-5 rounded-2xl border border-[#DBE6E7] bg-white p-4 shadow-2xl">
              <div className="flex items-center gap-3">
                <img src="/icon-192.png?v=psa5" alt="" className="h-10 w-10 rounded-xl" />
                <div className="flex-1">
                  <p className="text-[11px] font-semibold text-[#0B1F33]">Install Peptide SA?</p>
                  <p className="text-[8px] text-[#5D7182]">peptide-south-africa.co.za</p>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <span className="px-3 py-2 text-[9px] font-semibold text-[#5D7182]">Cancel</span>
                <span className="rounded-lg bg-[#082B57] px-4 py-2 text-[9px] font-semibold text-white">Install</span>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="mx-auto mt-4 flex w-fit items-center gap-2 rounded-full border border-[#DBE6E7] bg-white px-3 py-1.5 text-[10px] font-semibold text-[#082B57] shadow-sm">
        {ios ? <Apple className="h-3.5 w-3.5" /> : <span className="text-[#149F99]">▶</span>}
        {ios ? 'Safari · Add to Home Screen' : 'Chrome · Install app'}
      </div>
    </div>
  );
}
