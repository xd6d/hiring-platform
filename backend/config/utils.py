import time
import re

from django.db import connection

class QueryCountMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        self.start_time = time.time()
        self.queries_before = len(connection.queries)

        response = self.get_response(request)

        total_time = time.time() - self.start_time
        queries_after = len(connection.queries)
        queries_count = queries_after - self.queries_before
        print(f"Total time: {total_time:.2f}s, Queries: {queries_count}")
        for query in connection.queries[self.queries_before :]:
            try:
                print(self.shorten_query(query["sql"]))
            except Exception:
                pass

        return response

    def shorten_query(self, sql):
        pattern = re.compile(r"SELECT .*? FROM (.*?) ", re.IGNORECASE)
        match = pattern.search(sql)
        if match:
            return f"SELECT FROM {match.group(1)}"
        pattern = re.compile(r"INSERT INTO (.*?) ", re.IGNORECASE)
        match = pattern.search(sql)
        if match:
            return f"INSERT INTO {match.group(1)}"
        pattern = re.compile(r"UPDATE (.*?) ", re.IGNORECASE)
        match = pattern.search(sql)
        if match:
            return f"UPDATE {match.group(1)}"
        pattern = re.compile(r"DELETE FROM (.*?) ", re.IGNORECASE)
        match = pattern.search(sql)
        if match:
            return f"DELETE FROM {match.group(1)}"
        return sql
