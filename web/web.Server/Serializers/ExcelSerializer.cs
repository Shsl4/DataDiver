using ClosedXML.Excel;
using web.Server.Models;

namespace web.Server.Serializers;

public static class ExcelSerializer
{
    /// <summary>
    /// Fills labels at the first row of the provided sheet
    /// </summary>
    /// <param name="sheet">The sheet to use</param>
    /// <param name="labels">The labels to place</param>
    private static void FillLabels(IXLWorksheet sheet, List<string> labels)
    {
        for (var i = 1; i <= labels.Count; ++i)
        {
            sheet.Cell(1, i).Value = labels[i - 1];
        }
    }

    /// <summary>
    /// Resizes all columns in a workbook appropriately
    /// </summary>
    /// <param name="workbook">The workbook to format</param>
    private static void ResizeColumns(XLWorkbook workbook)
    {
        foreach (var ws in workbook.Worksheets)
        {
            const int minWidth = 10;
            const int maxWidth = 45;

            foreach (var column in ws.ColumnsUsed())
            {
                column.AdjustToContents();

                column.Width = column.Width switch
                {
                    < minWidth => minWidth,
                    > maxWidth => maxWidth,
                    _ => column.Width
                };

                column.Width += 5;
            }

            foreach (var row in ws.RowsUsed())
            {
                row.Height = 15;
            }
        }
    }

    /// <summary>
    /// Serializes Evaluation data into an Excel file
    /// </summary>
    /// <param name="data">The data to serialize</param>
    /// <returns>An array of bytes representing the Excel file</returns>
    public static byte[] Serialize(EvaluationData data)
    {
        using var workbook = new XLWorkbook();
        using var memorySteam = new MemoryStream();

        var main = workbook.AddWorksheet("Main");

        FillLabels(main, ["Scenario", "Answer IDs", "Answers", "Criteria"]);

        main.Cell(2, 1).Value = data.Scenario;

        var currentRow = 2;

        foreach (var entry in data.Answers)
        {
            main.Cell(currentRow, 2).Value = entry.Key;
            main.Cell(currentRow, 3).Value = entry.Value.Trim();

            main.Cell(currentRow, 2).Style.Alignment.SetWrapText(true);
            main.Cell(currentRow, 3).Style.Alignment.SetWrapText(true);
            main.Cell(currentRow, 2).SetHyperlink(new XLHyperlink($"{entry.Key[..16]}!A1"));

            currentRow++;
        }

        var maxRow = currentRow;

        currentRow = 2;

        foreach (var criteria in data.Criteria)
        {
            main.Cell(currentRow, 4).Value = criteria;
            main.Cell(currentRow, 4).Style.Alignment.SetWrapText(true);
            currentRow++;
        }

        foreach (var entry in data.Results)
        {
            var sheet = workbook.AddWorksheet(entry.Key[..16]);
            currentRow = 2;

            FillLabels(sheet, ["Result ID", "Criterion", "Grade", "Remark", "Timestamp", "Llm", "Sources"]);

            foreach (var result in entry.Value)
            {
                var optS = result.Sources.Count > 1 ? "s" : "";
                sheet.Cell(currentRow, 1).Value = result.ResultId;
                sheet.Cell(currentRow, 2).Value = result.Criterion;
                sheet.Cell(currentRow, 3).Value = result.Grade;
                sheet.Cell(currentRow, 4).Value = result.Remark;
                sheet.Cell(currentRow, 5).Value = DateTime.ParseExact(result.Timestamp, "dd/MM/yyyy HH:mm", null);
                sheet.Cell(currentRow, 6).Value = result.Llm;
                sheet.Cell(currentRow, 7).Value = $"{result.Sources.Count} source{optS}";
                currentRow++;
            }
        }

        var sourceRow = 2;
        var sourceSheet = workbook.AddWorksheet("Sources");

        FillLabels(sourceSheet, ["Document", "Pages"]);

        foreach (var entry in data.Results)
        {
            var sheet = workbook.Worksheet(entry.Key[..16]);

            currentRow = 2;

            foreach (var result in entry.Value)
            {
                var cell = sheet.Cell(currentRow, 7);
                var start = sourceRow;

                foreach (var source in result.Sources)
                {
                    sourceSheet.Cell(sourceRow, 1).Value = source.Key;
                    sourceSheet.Cell(sourceRow, 2).Value = string.Join(", ", source.Value);
                    sourceRow++;
                }

                cell.SetHyperlink(new XLHyperlink($"sources!A{start}:B{sourceRow - 1}"));

                sourceRow++;
                currentRow++;
            }
        }

        ResizeColumns(workbook);

        main.Range(2, 1, maxRow - 1, 1).Merge();
        main.Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Left);
        main.Cell(2, 1).Style.Alignment.SetWrapText(true);

        workbook.SaveAs(memorySteam);
        return memorySteam.ToArray();
    }
    
    /// <summary>
    /// Serializes history data into an Excel file
    /// </summary>
    /// <param name="data">The data to serialize</param>
    /// <returns>An array of bytes representing the Excel file</returns>
    public static byte[] Serialize(List<HistoryEntry> data)
    {
        using var workbook = new XLWorkbook();
        using var memorySteam = new MemoryStream();

        var main = workbook.AddWorksheet("Main");
        var sourceSheet = workbook.AddWorksheet("Sources");

        FillLabels(main, ["Type", "Content", "Timestamp", "Llm", "Sources"]);
        FillLabels(sourceSheet, ["Document", "Pages"]);

        var currentRow = 2;
        var sourceRow = 2;
        
        foreach (var entry in data)
        {
            main.Cell(currentRow, 1).Value = entry.Type;
            main.Cell(currentRow, 2).Value = entry.Content;
            main.Cell(currentRow, 3).Value = DateTime.ParseExact(entry.Timestamp, "dd/MM/yyyy HH:mm", null);
            main.Cell(currentRow, 4).Value = entry.Llm ?? "/";

            if (entry.Sources != null)
            {
                var optS = entry.Sources?.Count > 1 ? "s" : "";
                var cell = main.Cell(currentRow, 5);
                
                cell.Value = $"{entry.Sources?.Count} source{optS}";
                
                var start = sourceRow;

                foreach (var source in entry.Sources!)
                {
                    sourceSheet.Cell(sourceRow, 1).Value = source.Key;
                    sourceSheet.Cell(sourceRow, 2).Value = string.Join(", ", source.Value);
                    sourceRow++;
                }

                cell.SetHyperlink(new XLHyperlink($"sources!A{start}:B{sourceRow - 1}"));
                sourceRow++;
            }
            else
            {
                main.Cell(currentRow, 5).Value = "/";
            }
            
            currentRow++;
        }
        
        FillLabels(sourceSheet, ["Document", "Pages"]);

        ResizeColumns(workbook);
        
        workbook.SaveAs(memorySteam);
        return memorySteam.ToArray();
    }
    
}