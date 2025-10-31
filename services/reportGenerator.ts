import type { HistoryEntry, Settings } from '../types';
import { TranslationKey } from '../i18n/locales';

export const downloadReport = (
    entry: HistoryEntry, 
    settings: Settings,
    t: (key: TranslationKey, replacements?: Record<string, string | number>) => string,
    convertTemperature: (celsius: number) => number
) => {
    const { data, result } = entry;
    
    const reportHTML = `
    <!DOCTYPE html>
    <html lang="${settings.uiLanguage}">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${t('analysisResult')}</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 0;
                background-color: #f9f9f9;
            }
            .container {
                max-width: 800px;
                margin: 20px auto;
                padding: 20px;
                background-color: #fff;
                border: 1px solid #ddd;
                box-shadow: 0 0 10px rgba(0,0,0,0.05);
            }
            h1, h2, h3, h4 {
                color: #2c5232;
                margin-top: 1.5em;
                margin-bottom: 0.5em;
            }
            h1 {
                font-size: 2em;
                text-align: center;
                border-bottom: 2px solid #4CAF50;
                padding-bottom: 10px;
                margin-bottom: 20px;
            }
            .header {
                text-align: center;
                margin-bottom: 20px;
            }
            .header p {
                margin: 0;
                color: #666;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }
            th, td {
                border: 1px solid #ddd;
                padding: 10px;
                text-align: left;
            }
            th {
                background-color: #f2f2f2;
                font-weight: bold;
            }
            .score-card {
                background-color: #e8f5e9;
                border-left: 5px solid #4CAF50;
                padding: 15px;
                margin: 20px 0;
                text-align: center;
            }
            .score {
                font-size: 3em;
                font-weight: bold;
                color: #2e7d32;
            }
            .interpretation {
                background-color: #f5f5f5;
                padding: 15px;
                border-radius: 5px;
            }
            ul {
                padding-left: 20px;
            }
            li {
                margin-bottom: 8px;
            }
            .recommendation-card {
                border: 1px solid #c8e6c9;
                border-radius: 5px;
                padding: 15px;
                margin-bottom: 15px;
            }
            .recommendation-card h4 {
                margin-top: 0;
            }
            @media print {
                body {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                .container {
                    box-shadow: none;
                    border: none;
                    margin: 0;
                    max-width: 100%;
                }
                .no-print {
                    display: none;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${t('soilSage')}</h1>
                <p>${t('analysisResult')}</p>
                <p>${new Date(entry.id).toLocaleString()}</p>
            </div>

            <h2>${t('soilDataInput')}</h2>
            <table>
                <thead>
                    <tr>
                        <th>${t('ph')}</th>
                        <th>${t('moisture')} (%)</th>
                        <th>${t('temp')} (${settings.unit === 'Celsius' ? '°C' : '°F'})</th>
                        <th>${t('n')} (ppm)</th>
                        <th>${t('p')} (ppm)</th>
                        <th>${t('k')} (ppm)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>${data.ph.toFixed(1)}</td>
                        <td>${data.moisture}</td>
                        <td>${convertTemperature(data.temperature).toFixed(1)}</td>
                        <td>${data.nitrogen}</td>
                        <td>${data.phosphorus}</td>
                        <td>${data.potassium}</td>
                    </tr>
                </tbody>
            </table>

            <div class="score-card">
                <h3>${t('soilHealthScoreTitle')}</h3>
                <div class="score">${result.soil_health_score}</div>
            </div>

            <div class="interpretation">
                <h3>${t('interpretation')}</h3>
                <p>${result.interpretation}</p>
            </div>

            <h2>${t('plantRecommendations')}</h2>
            ${result.recommendations.plants.map(plant => `
                <div class="recommendation-card">
                    <h4>${plant.name}</h4>
                    <p><strong>${t('reasoning')}:</strong> ${plant.reasoning}</p>
                    ${plant.care_tips && plant.care_tips.length > 0 ? `
                        <p><strong>${t('careTips')}:</strong></p>
                        <ul>
                            ${plant.care_tips.map(tip => `<li>${tip}</li>`).join('')}
                        </ul>
                    ` : ''}
                     ${plant.ideal_conditions && plant.ideal_conditions.length > 0 ? `
                        <p><strong>${t('idealConditions')}:</strong></p>
                        <ul>
                            ${plant.ideal_conditions.map(condition => `<li>${condition}</li>`).join('')}
                        </ul>
                    ` : ''}
                </div>
            `).join('')}

            <h2>${t('amendmentRecommendations')}</h2>
            ${result.recommendations.amendments.length > 0 ? result.recommendations.amendments.map(amendment => `
                <div class="recommendation-card">
                    <h4>${amendment.name}</h4>
                    <p><strong>${t('reasoning')}:</strong> ${amendment.reasoning}</p>
                    <p><strong>${t('application')}:</strong> ${amendment.application_rate}</p>
                </div>
            `).join('') : `<p>${t('noAmendmentsNeeded')}</p>`}

        </div>
    </body>
    </html>
    `;

    const reportWindow = window.open('', '_blank');
    if (reportWindow) {
        reportWindow.document.write(reportHTML);
        reportWindow.document.close();
        // Use a short timeout to ensure content is rendered before printing
        setTimeout(() => {
            reportWindow.print();
        }, 500);
    } else {
        alert("Please allow popups to download the report.");
    }
};
