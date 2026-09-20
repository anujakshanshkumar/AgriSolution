#!/usr/bin/env python3
"""
Simple script to generate a PDF from a plain text references file using ReportLab.
Creates `REFERENCES.pdf` in the project root.
"""
import textwrap
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
import sys

INPUT = 'REFERENCES.txt'
OUTPUT = 'REFERENCES.pdf'

def create_pdf(input_path=INPUT, output_path=OUTPUT):
    with open(input_path, 'r', encoding='utf-8') as f:
        lines = f.read().splitlines()

    c = canvas.Canvas(output_path, pagesize=A4)
    width, height = A4
    margin = 48
    max_width = width - margin * 2
    y = height - margin

    text = c.beginText(margin, y)
    text.setFont('Helvetica-Bold', 14)
    text.textLine('References')
    text.textLine('')
    text.setFont('Helvetica', 11)
    y -= 40

    for raw in lines:
        if raw.strip() == '':
            text.textLine('')
            y -= 14
            continue
        # Wrap the line to fit page width
        wrapped = textwrap.wrap(raw, 100)
        for w in wrapped:
            if y <= margin + 30:
                c.drawText(text)
                c.showPage()
                text = c.beginText(margin, height - margin)
                text.setFont('Helvetica', 11)
                y = height - margin
            text.textLine(w)
            y -= 14
    c.drawText(text)
    c.save()
    print('Wrote', output_path)

if __name__ == '__main__':
    try:
        create_pdf()
    except Exception as e:
        print('Error:', e)
        sys.exit(1)
