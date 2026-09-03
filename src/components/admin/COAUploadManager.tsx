import { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { peptides } from '@/data/peptides';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logAudit } from '@/lib/auditLog';

interface ParsedCOA {
  taskNumber: string;
  verifyKey: string;
  sampleName: string;
  measuredAmount: string;
  purity: string;
  testDate: string;
  manufacturer: string;
}

export default function COAUploadManager() {
  const [selectedPeptide, setSelectedPeptide] = useState('');
  const [uploading, setUploading] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedCOA | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  // Manual entry fields
  const [taskNumber, setTaskNumber] = useState('');
  const [verifyKey, setVerifyKey] = useState('');
  const [sampleName, setSampleName] = useState('');
  const [measuredAmount, setMeasuredAmount] = useState('');
  const [purity, setPurity] = useState('');
  const [testDate, setTestDate] = useState('');
  const [manufacturer, setManufacturer] = useState('https://zztai-tech.com/');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `coa-${Date.now()}.${fileExt}`;
      const filePath = `manual/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('coa-pdfs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData, error: signedUrlError } = await supabase.storage
        .from('coa-pdfs')
        .createSignedUrl(filePath, 600);
      if (signedUrlError) throw signedUrlError;

      setFileUrl(urlData.signedUrl);
      setManualMode(true);
      toast.success('COA uploaded securely. Record the certificate fields below.');
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    if (!selectedPeptide || !taskNumber || !sampleName || !measuredAmount) {
      toast.error('Please fill in required fields (Peptide, Task #, Sample Name, Amount)');
      return;
    }

    const coaEntry: ParsedCOA = {
      taskNumber,
      verifyKey,
      sampleName,
      measuredAmount,
      purity,
      testDate,
      manufacturer,
    };

    // In a production app this would save to DB. For now, show the JSON to copy.
    const peptideName = peptides.find(p => p.id === selectedPeptide)?.shortName || '';
    
    const jsonSnippet = JSON.stringify(coaEntry, null, 2);
    navigator.clipboard.writeText(jsonSnippet).then(() => {
      toast.success(`COA for ${peptideName} copied to clipboard! Add it to the peptide data file.`);
    }).catch(() => {
      toast.success(`COA for ${peptideName} saved. See console for data.`);
      console.log('COA Entry:', coaEntry);
    });

    void logAudit({
      action: 'admin.coa_upload',
      entityType: 'peptide',
      entityId: selectedPeptide,
      metadata: { peptideName, taskNumber, purity, sampleName },
    });

    // Reset form
    setTaskNumber('');
    setVerifyKey('');
    setSampleName('');
    setMeasuredAmount('');
    setPurity('');
    setTestDate('');
    setParsedData(null);
    setFileUrl(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            COA Upload & Parser
          </CardTitle>
          <CardDescription>Upload Janoshik COA documents to the private admin bucket, then record the verified certificate fields</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Peptide selector */}
          <div>
            <Label>Assign to Peptide</Label>
            <Select value={selectedPeptide} onValueChange={setSelectedPeptide}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select peptide..." />
              </SelectTrigger>
              <SelectContent>
                {peptides.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.shortName} — {p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File upload */}
          <div>
            <Label>Upload COA Document (PDF/Image)</Label>
            <div className="mt-1 border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleFileUpload}
                className="hidden"
                id="coa-upload"
                disabled={uploading}
              />
              <label htmlFor="coa-upload" className="cursor-pointer">
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <span className="text-sm text-muted-foreground">Uploading...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Click to upload PDF or image</span>
                    <span className="text-xs text-muted-foreground">Supports PDF, JPG, PNG, WebP</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Uploaded file preview */}
          {fileUrl && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 rounded-md p-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>File uploaded</span>
              <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-auto text-xs">
                View file
              </a>
            </div>
          )}

          {/* Parsed / Manual entry */}
          {(parsedData || manualMode || fileUrl) && (
            <div className="border-t border-border pt-4 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                {parsedData ? (
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Auto-parsed
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Manual Entry
                  </Badge>
                )}
                <button
                  onClick={() => setManualMode(true)}
                  className="text-xs text-primary hover:underline ml-auto"
                >
                  Edit manually
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Task Number</Label>
                  <Input value={taskNumber} onChange={e => setTaskNumber(e.target.value)} placeholder="#83561" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Verify Key</Label>
                  <Input value={verifyKey} onChange={e => setVerifyKey(e.target.value)} placeholder="4UPD97DVG8VB" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Sample Name</Label>
                  <Input value={sampleName} onChange={e => setSampleName(e.target.value)} placeholder="Retatrutide 20mg" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Measured Amount</Label>
                  <Input value={measuredAmount} onChange={e => setMeasuredAmount(e.target.value)} placeholder="20.48 mg" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Purity</Label>
                  <Input value={purity} onChange={e => setPurity(e.target.value)} placeholder="99.558%" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Test Date</Label>
                  <Input value={testDate} onChange={e => setTestDate(e.target.value)} placeholder="21 OCT 2025" className="mt-1" />
                </div>
              </div>

              <div>
                <Label className="text-xs">Manufacturer URL</Label>
                <Input value={manufacturer} onChange={e => setManufacturer(e.target.value)} className="mt-1" />
              </div>

              <Button onClick={handleSave} className="w-full">
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Save COA Entry
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
