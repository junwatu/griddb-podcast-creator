import { GridDBConfig, GridDBColumn, GridDBData, GridDBQuery, GridDBResponse, GridDBError } from './types/griddb.types';

/**
 * Creates a GridDB client for making API requests
 * @param config Configuration object
 * @returns The GridDB client with typed methods
 */
export function createGridDBClient(config: GridDBConfig) {
	const { griddbWebApiUrl, username, password } = config;

	const baseUrl = griddbWebApiUrl;
	const authToken = Buffer.from(`${username}:${password}`).toString('base64');

	async function makeRequest(path: string, payload: unknown, method?: string): Promise<GridDBResponse> {
		console.log(`path: ${baseUrl}${path}`);
		console.log(`authToken: ${authToken}`);
		try {
			const response = await fetch(`${baseUrl}${path}`, {
				method: method || 'POST',
				headers: {
					'Content-Type': 'application/json; charset=UTF-8',
					'Authorization': `Basic ${authToken}`,
				},
				body: JSON.stringify(payload),
			});

			const responseText = await response.text();

			if (!response.ok) {
				throw new GridDBError(
					`HTTP error! status: ${response.status} - ${responseText || response.statusText}`,
					response.status,
					response.status,
					responseText
				);
			}

			console.log(`Response: ${responseText}`);

			return processResponse(responseText);
		} catch (error) {
			if (error instanceof GridDBError) {
				throw error;
			}
			throw new GridDBError('Failed to make request to GridDB', undefined, undefined, error);
		}
	}

	function processResponse(responseText: string, successMessage = 'Operation completed successfully'): GridDBResponse {
		if (responseText) {
			try {
				return JSON.parse(responseText);
			} catch {
				return { message: successMessage, response: responseText };
			}
		}
		return { message: successMessage };
	}

	async function createContainer({
		containerName = 'resumes',
		columns = [
			{ name: 'id', type: 'INTEGER' },
			{ name: 'ocrResponse', type: 'STRING' },
			{ name: 'audioScript', type: 'STRING' },
			{ name: 'audioFiles', type: 'STRING' }
		],
	}: {
		containerName?: string;
		columns?: GridDBColumn[];
	} = {}): Promise<GridDBResponse> {
		const payload = {
			container_name: containerName,
			container_type: 'COLLECTION',
			rowkey: true,
			columns,
		};

		const existingContainerUrl = `/containers/${containerName}/info`;

		try {
			const response = await fetch(`${baseUrl}${existingContainerUrl}`, {
				method: 'GET',
				headers: {
					'Authorization': `Basic ${authToken}`,
				}
			});

			if (response.status === 404) {
				return await makeRequest('/containers', payload);
			}
			console.log(`Container ${containerName} already exists`);
			return { message: `Container ${containerName} already exists` };
		} catch (error: unknown) {
			if (error instanceof GridDBError) {
				throw error;
			}
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			throw new GridDBError(`Failed to create GridDB container: ${errorMessage}`, undefined, undefined, error);
		}
	}

	async function insertData({
		data,
		containerName = 'podcasts'
	}: {
		data: GridDBData;
		containerName?: string;
	}): Promise<GridDBResponse> {
		console.log(data);
		try {
			const row = [
				parseInt(data.id.toString()),
				data.ocrResponse,
				data.audioScript,
				data.audioFiles
			];

			const path = `/containers/${containerName}/rows`;
			return await makeRequest(path, [row], 'PUT');
		} catch (error) {
			if (error instanceof GridDBError) {
				throw error;
			}
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			throw new GridDBError(`Failed to insert data: ${errorMessage}`, undefined, undefined, error);
		}
	}

	async function searchData(queries: GridDBQuery[]): Promise<GridDBResponse> {
		console.log(queries);
		try {
			if (!Array.isArray(queries) || queries.length === 0) {
				throw new GridDBError('Queries must be a non-empty array of SQL query objects.');
			}

			return await makeRequest('/sql/dml/query', queries);
		} catch (error) {
			if (error instanceof GridDBError) {
				throw error;
			}
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

			throw new GridDBError(`Failed to search data: ${errorMessage}`, undefined, undefined, error);
		}
	}

	return {
		createContainer,
		insertData,
		searchData,
	};
}